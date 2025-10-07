import requests
import csv
import sys

def download_pois(city_name, lat, lon, bbox_size=0.08):
    """Download POIs for a given city using OpenStreetMap Overpass API"""
    
    # Calculate bounding box
    lat_min = lat - bbox_size
    lat_max = lat + bbox_size
    lon_min = lon - bbox_size
    lon_max = lon + bbox_size
    
    bbox = f"{lat_min},{lon_min},{lat_max},{lon_max}"
    
    print(f"📍 Searching for POIs in {city_name} at: {lat}, {lon}")
    print(f"🗺️  Search area: {bbox}")
    
    # Overpass query
    query = f"""
    [out:csv(name,amenity,cuisine,shop,tourism,healthcare,lat,lon)];
    (
      node["amenity"~"restaurant|hotel|hospital|bank|fuel|pharmacy|school|university|library|police|fire_station|post_office|atm|bus_station|taxi|car_rental|parking"]({bbox});
      node["shop"~"supermarket|mall|department_store|convenience|clothes|electronics|bookshop"]({bbox});
      node["tourism"~"hotel|attraction|museum|gallery|zoo|theme_park"]({bbox});
      node["healthcare"~"hospital|clinic|pharmacy|dentist|doctor"]({bbox});
      way["amenity"~"restaurant|hotel|hospital|bank|fuel|pharmacy|school|university|library|police|fire_station|post_office|atm|bus_station|taxi|car_rental|parking"]({bbox});
      way["shop"~"supermarket|mall|department_store|convenience|clothes|electronics|bookshop"]({bbox});
      way["tourism"~"hotel|attraction|museum|gallery|zoo|theme_park"]({bbox});
      way["healthcare"~"hospital|clinic|pharmacy|dentist|doctor"]({bbox});
    );
    out center;
    """
    
    print("📥 Downloading POI data from OpenStreetMap...")
    
    try:
        response = requests.get(
            "http://overpass-api.de/api/interpreter",
            params={'data': query},
            timeout=30
        )
        response.raise_for_status()
        
        if not response.text.strip():
            print("❌ No data received from API")
            return []
            
        # Parse the response
        lines = response.text.strip().split('\n')
        if len(lines) < 2:
            print("❌ No POI data found")
            return []
            
        print("🧹 Processing and cleaning data...")
        
        pois = []
        for line in lines[1:]:  # Skip header
            parts = line.split('\t')
            if len(parts) < 8:
                continue
                
            name, amenity, cuisine, shop, tourism, healthcare, lat_str, lon_str = parts[:8]
            
            # Skip if no name or coordinates
            if not name or name == 'null' or not lat_str or not lon_str:
                continue
                
            try:
                lat_float = float(lat_str)
                lon_float = float(lon_str)
            except ValueError:
                continue
            
            # Determine category
            category = "other"
            description = "POI"
            
            if amenity and amenity != 'null':
                if amenity in ['restaurant', 'cafe', 'fast_food', 'bar', 'pub']:
                    category = 'restaurant'
                elif amenity in ['hotel', 'guest_house', 'hostel', 'motel']:
                    category = 'hotel'
                elif amenity in ['hospital', 'clinic']:
                    category = 'hospital'
                elif amenity in ['bank', 'atm']:
                    category = 'bank'
                elif amenity == 'fuel':
                    category = 'gas_station'
                elif amenity == 'pharmacy':
                    category = 'pharmacy'
                elif amenity in ['school', 'university', 'library']:
                    category = 'education'
                elif amenity in ['police', 'fire_station']:
                    category = 'emergency'
                elif amenity in ['bus_station', 'taxi', 'car_rental']:
                    category = 'transportation'
                elif amenity == 'parking':
                    category = 'parking'
                else:
                    category = 'amenity'
                description = amenity
                
            elif shop and shop != 'null':
                category = 'shopping'
                description = shop
                
            elif tourism and tourism != 'null':
                category = 'tourism'
                description = tourism
                
            elif healthcare and healthcare != 'null':
                category = 'healthcare'
                description = healthcare
            
            # Add cuisine info if available
            if cuisine and cuisine != 'null':
                description += f" ({cuisine})"
            
            # Clean name and description
            clean_name = name.replace('"', '').replace('\n', ' ').strip()
            clean_description = description.replace('"', '').replace('\n', ' ').strip()
            
            pois.append({
                'name': clean_name,
                'category': category,
                'latitude': lat_float,
                'longitude': lon_float,
                'description': clean_description
            })
        
        return pois
        
    except requests.RequestException as e:
        print(f"❌ Error downloading data: {e}")
        return []

def save_to_csv(pois, filename):
    """Save POIs to CSV file"""
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['name', 'category', 'latitude', 'longitude', 'description']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for poi in pois:
            writer.writerow(poi)

def main():
    # Predefined city coordinates
    cities = {
        'Patna': (25.6093, 85.1376),
        'Delhi': (28.6139, 77.2090),
        'Mumbai': (19.0760, 72.8777),
        'Bangalore': (12.9716, 77.5946),
        'Chennai': (13.0827, 80.2707),
        'Kolkata': (22.5726, 88.3639),
        'Hyderabad': (17.3850, 78.4867),
        'Ahmedabad': (23.0225, 72.5714),
        'Pune': (18.5204, 73.8567),
        'Jaipur': (26.9124, 75.7873),
        'Lucknow': (26.8467, 80.9462),
        'Kanpur': (26.4499, 80.3319),
        'New York': (40.7128, -74.0060),
        'London': (51.5074, -0.1278),
        'Paris': (48.8566, 2.3522),
        'Tokyo': (35.6762, 139.6503),
        'Sydney': (-33.8688, 151.2093)
    }
    
    if len(sys.argv) < 2:
        print("Usage: python3 poi_downloader.py \"City Name\"")
        print("Available cities:")
        for city in cities.keys():
            print(f"  - {city}")
        return
    
    city_name = sys.argv[1]
    
    if city_name not in cities:
        print(f"❌ City '{city_name}' not found in predefined list.")
        print("Available cities:")
        for city in cities.keys():
            print(f"  - {city}")
        return
    
    lat, lon = cities[city_name]
    output_file = f"{city_name.replace(' ', '_')}_pois.csv"
    
    # Download POIs
    pois = download_pois(city_name, lat, lon)
    
    if pois:
        # Save to CSV
        save_to_csv(pois, output_file)
        
        print(f"✅ Successfully downloaded {len(pois)} POIs for {city_name}")
        print(f"📁 Data saved to: {output_file}")
        
        # Show category breakdown
        categories = {}
        for poi in pois:
            cat = poi['category']
            categories[cat] = categories.get(cat, 0) + 1
        
        print("\n📊 POI Categories found:")
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            print(f"  {count:3d} {cat}")
        
        # Show first 5 POIs
        print(f"\n📄 First 5 POIs:")
        for i, poi in enumerate(pois[:5]):
            print(f"  {i+1}. {poi['name']} ({poi['category']}) at {poi['latitude']:.4f}, {poi['longitude']:.4f}")
    else:
        print(f"⚠️  No POIs found for {city_name}")

if __name__ == "__main__":
    main()