import express from 'express';
import axios from 'axios';
import { verifyFirebaseToken, AuthenticatedRequest } from '../middleware/auth';
import { adminDb } from '../config/firebase-admin.js';
import crypto from 'crypto';

// --- Encryption Utilities ---
const ENCRYPTION_KEY = process.env.EPLQ_SECRET_KEY || 'default_key_32bytes_long!default_key_32bytes_long!'; // 32 bytes for AES-256
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// --- Predicate-Only Range Query Simulation ---
function isPOIWithinRadius(encryptedQuery: EncryptedQuery, encryptedPOI: EncryptedPOI): boolean {
  try {
    const userLocation = JSON.parse(decrypt(encryptedQuery.encryptedLocation));
    const radius = parseFloat(decrypt(encryptedQuery.encryptedRadius));
    const poiLocation = JSON.parse(decrypt(encryptedPOI.encryptedData));
    // Calculate Euclidean distance
    const dx = userLocation.lat - poiLocation.lat;
    const dy = userLocation.lng - poiLocation.lng;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= radius;
  } catch {
    return false;
  }
}

const router = express.Router();

// TypeScript interfaces for encrypted query and POI
export interface EncryptedQuery {
  encryptedLocation: string;
  encryptedRadius: string;
  queryId: string;
  timestamp: string;
}

export interface EncryptedPOI {
  encryptedData: string;
  metadata: Record<string, unknown>;
  uploadedBy: string;
  uploadedAt: string;
}

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'EPLQ API Proxy Server is running'
  });
});

// Upload encrypted POI data (Admin only)
router.post('/admin/upload-poi', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { poiLocation, metadata } = req.body;
    const adminUserId = req.user?.uid;

    // Verify admin permissions
    const adminDoc = await adminDb.collection('users').doc(adminUserId!).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    // Use EncryptedPOI type
    const encryptedPOI: EncryptedPOI = {
      encryptedData: encrypt(JSON.stringify(poiLocation)),
      metadata: metadata,
      uploadedBy: adminUserId!,
      uploadedAt: new Date().toISOString()
    };

    // Store encrypted POI data
    const poiRef = await adminDb.collection('encrypted_pois').add(encryptedPOI);

    console.log(`Admin ${adminUserId} uploaded POI data: ${poiRef.id}`);

    res.json({
      success: true,
      poiId: poiRef.id,
      message: 'Encrypted POI data uploaded successfully'
    });
  } catch (error: unknown) {
    console.error('POI upload error:', error);
    res.status(500).json({
      error: 'Failed to upload POI data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get POI data for admin management
router.get('/admin/pois', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const adminUserId = req.user?.uid;

    // Verify admin permissions
    const adminDoc = await adminDb.collection('users').doc(adminUserId!).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    const poisSnapshot = await adminDb.collection('encrypted_pois')
      .orderBy('uploadedAt', 'desc')
      .limit(100)
      .get();

      const pois = poisSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({ pois });
  } catch (error: unknown) {
    res.status(500).json({
      error: 'Failed to fetch POI data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Generate encrypted query (User)
router.post('/user/generate-query', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { userLocation, radius, queryType } = req.body;
    const userId = req.user?.uid;
    const encryptedQuery: EncryptedQuery = {
      encryptedLocation: encrypt(JSON.stringify(userLocation)),
      encryptedRadius: encrypt(radius.toString()),
      queryId: `query_${Date.now()}_${userId}`,
      timestamp: new Date().toISOString()
    };

    // Log the query generation (for evaluation metrics)
    await adminDb.collection('query_logs').add({
      userId,
      queryType,
      radius,
      generatedAt: new Date().toISOString(),
      queryId: encryptedQuery.queryId
    });

    console.log(`User ${userId} generated encrypted query: ${encryptedQuery.queryId}`);

    res.json({
      encryptedQuery,
      queryId: encryptedQuery.queryId,
      message: 'Encrypted query generated successfully'
    });
  } catch (error: unknown) {
    console.error('Query generation error:', error);
    res.status(500).json({
      error: 'Failed to generate encrypted query',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Fetch encrypted POI results (User)
router.post('/user/search-pois', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { encryptedQuery } = req.body;
    const userId = req.user?.uid;

    // Fetch encrypted POIs from database
    const poisSnapshot = await adminDb.collection('encrypted_pois').get();

    // Here you would implement privacy-preserving tree index search
    // For now, we'll simulate the encrypted search process
    const matchingPOIs = [];

    for (const doc of poisSnapshot.docs) {
      const poiData = doc.data() as EncryptedPOI;

      if (isPOIWithinRadius(encryptedQuery, poiData)) {
        matchingPOIs.push({
          id: doc.id,
          metadata: poiData.metadata
        });
      }
    }

    // Log the search operation
    await adminDb.collection('search_logs').add({
      userId,
      queryId: encryptedQuery.queryId,
      resultCount: matchingPOIs.length,
      searchedAt: new Date().toISOString()
    });

    console.log(`User ${userId} found ${matchingPOIs.length} POIs within range`);

    res.json({
      result: matchingPOIs,
      count: matchingPOIs.length,
      queryId: encryptedQuery.queryId,
    });
  } catch (error: unknown) {
    console.error('POI search error:', error);
    res.status(500).json({
      error: 'Failed to search POIs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get real POI data from external API (for populationg database)
router.get('/poi/fetch-external', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { location, radius, type } = req.body;
    const adminUserId = req.user?.uid;

    // Verify admin permissions
    const adminDoc = await adminDb.collection('users').doc(adminUserId!).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required'
      });
    }

    // Fetch POIs from Google Places API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${location.lat}, ${location.lng}`,
        radius: radius,
        type: type,
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    });

    interface GooglePlace {
      name: string;
      geometry: {
        location: {
          lat: number;
          lng: number;
        };
      };
      types: string[];
      rating?: number;
      vicinity?: string;
      place_id: string;
    }

    const pois = response.data.results.map((place: GooglePlace) => {
      return {
        name: place.name,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        type: place.types[0],
        rating: place.rating,
        vicinity: place.vicinity,
        placeId: place.place_id
      };
    });

    res.json({
      pois,
      count: pois.length,
      source: 'google_places'
    });
  } catch (error: unknown) {
    console.error('External POI fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch external POI data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


export default router;




