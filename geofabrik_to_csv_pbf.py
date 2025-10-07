#!/usr/bin/env python3
"""
Geofabrik OSM Data to CSV Converter with PBF Support
Converts OSM data downloaded from Geofabrik to CSV format for EPLQ project
Supports .osm, .osm.bz2, .osm.gz, .osm.pbf, and .zip files
"""

import os
import sys
import zipfile
import xml.etree.ElementTree as ET
import csv
import gzip
import bz2
from pathlib import Path
import argparse

# Try to import osmium for PBF support
try:
    import osmium
    OSMIUM_AVAILABLE = True
except ImportError:
    OSMIUM_AVAILABLE = False

class POIHandler(osmium.SimpleHandler):
    """Handler for processing OSM data with osmium"""
    
    def __init__(self, bounds=None, max_pois=None):
        osmium.SimpleHandler.__init__(self)
        self.pois = []
        self.bounds = bounds
        self.max_pois = max_pois
        self.processed_count = 0
        
    def node(self, n):
        if self.max_pois and len(self.pois) >= self.max_pois:
            return
            
        # Check bounds if specified
        if self.bounds:
            min_lat, max_lat, min_lng, max_lng = self.bounds
            if not (min_lat <= n.location.lat <= max_lat and min_lng <= n.location.lon <= max_lng):
                return
        
        # Convert tags to dictionary
        tags = {tag.k: tag.v for tag in n.tags}
        
        if not tags:
            return
            
        category = self.categorize_poi(tags)
        if not category:
            return
            
        name = tags.get('name', f"Unknown {category.title()}")
        description = self.get_description(tags)
        
        # Validate coordinates
        lat, lng = n.location.lat, n.location.lon
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            return
            
        self.pois.append({
            'name': name,
            'category': category,
            'latitude': lat,
            'longitude': lng,
            'description': description
        })
        
        if len(self.pois) % 100 == 0:
            print(f"📍 Extracted {len(self.pois)} POIs...")
    
    def categorize_poi(self, tags):
        """Categorize POI based on OSM tags"""
        amenity = tags.get('amenity', '')
        shop = tags.get('shop', '')
        tourism = tags.get('tourism', '')
        healthcare = tags.get('healthcare', '')
        railway = tags.get('railway', '')
        aeroway = tags.get('aeroway', '')
        highway = tags.get('highway', '')
        leisure = tags.get('leisure', '')
        
        # Restaurant/Food
        if amenity in ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'food_court', 'biergarten']:
            return 'restaurant'
        
        # Hotel/Accommodation
        elif amenity in ['hotel', 'guest_house', 'hostel', 'motel'] or tourism in ['hotel', 'hostel', 'guest_house', 'motel']:
            return 'hotel'
        
        # Healthcare
        elif amenity in ['hospital', 'clinic', 'pharmacy', 'dentist', 'doctors', 'veterinary'] or healthcare:
            return 'hospital'
        
        # Transportation
        elif (amenity in ['bus_station', 'taxi', 'fuel', 'ferry_terminal'] or 
              railway in ['station', 'halt', 'tram_stop'] or
              aeroway in ['aerodrome', 'helipad'] or
              highway == 'bus_stop'):
            return 'transportation'
        
        # Gas Station
        elif amenity in ['fuel', 'charging_station']:
            return 'gas_station'
        
        # Shopping
        elif (shop or 
              amenity in ['marketplace', 'shopping_centre'] or
              tourism == 'attraction' and 'market' in tags.get('name', '').lower()):
            return 'shopping'
        
        # Recreation
        elif (leisure in ['park', 'playground', 'sports_centre', 'stadium', 'swimming_pool', 'golf_course'] or
              amenity in ['theatre', 'cinema', 'arts_centre'] or
              tourism in ['zoo', 'theme_park']):
            return 'recreation'
        
        # Education
        elif amenity in ['school', 'university', 'college', 'kindergarten', 'library']:
            return 'education'
        
        # Tourism
        elif (tourism in ['attraction', 'museum', 'monument', 'viewpoint', 'gallery', 'information'] or
              amenity in ['place_of_worship'] or
              tags.get('historic')):
            return 'tourism'
        
        # Services
        elif amenity in ['bank', 'atm', 'post_office', 'police', 'fire_station', 'courthouse', 'townhall']:
            return 'services'
        
        return None
    
    def get_description(self, tags):
        """Generate description from OSM tags"""
        parts = []
        
        if 'amenity' in tags:
            parts.append(f"Amenity: {tags['amenity']}")
        if 'shop' in tags:
            parts.append(f"Shop: {tags['shop']}")
        if 'tourism' in tags:
            parts.append(f"Tourism: {tags['tourism']}")
        if 'addr:street' in tags:
            parts.append(f"Street: {tags['addr:street']}")
        if 'addr:city' in tags:
            parts.append(f"City: {tags['addr:city']}")
        if 'cuisine' in tags:
            parts.append(f"Cuisine: {tags['cuisine']}")
        if 'description' in tags:
            parts.append(tags['description'])
            
        return '; '.join(parts) if parts else 'OSM Point of Interest'

def extract_zip_file(zip_path, extract_to):
    """Extract zip file to specified directory"""
    print(f"📦 Extracting {zip_path}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)
    print(f"✅ Extracted to {extract_to}")

def find_osm_files(directory):
    """Find all OSM files in directory"""
    osm_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if any(file.endswith(ext) for ext in ['.osm', '.osm.bz2', '.osm.gz', '.osm.pbf']):
                osm_files.append(os.path.join(root, file))
    return osm_files

def open_osm_file(file_path):
    """Open OSM file with appropriate decompression"""
    if file_path.endswith('.bz2'):
        return bz2.open(file_path, 'rt', encoding='utf-8')
    elif file_path.endswith('.gz'):
        return gzip.open(file_path, 'rt', encoding='utf-8')
    else:
        return open(file_path, 'r', encoding='utf-8')

def categorize_poi_xml(tags):
    """Categorize POI based on OSM tags for XML parsing"""
    amenity = tags.get('amenity', '')
    shop = tags.get('shop', '')
    tourism = tags.get('tourism', '')
    healthcare = tags.get('healthcare', '')
    railway = tags.get('railway', '')
    aeroway = tags.get('aeroway', '')
    highway = tags.get('highway', '')
    leisure = tags.get('leisure', '')
    
    # Restaurant/Food
    if amenity in ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'food_court', 'biergarten']:
        return 'restaurant'
    
    # Hotel/Accommodation
    elif amenity in ['hotel', 'guest_house', 'hostel', 'motel'] or tourism in ['hotel', 'hostel', 'guest_house', 'motel']:
        return 'hotel'
    
    # Healthcare
    elif amenity in ['hospital', 'clinic', 'pharmacy', 'dentist', 'doctors', 'veterinary'] or healthcare:
        return 'hospital'
    
    # Transportation
    elif (amenity in ['bus_station', 'taxi', 'fuel', 'ferry_terminal'] or 
          railway in ['station', 'halt', 'tram_stop'] or
          aeroway in ['aerodrome', 'helipad'] or
          highway == 'bus_stop'):
        return 'transportation'
    
    # Gas Station
    elif amenity in ['fuel', 'charging_station']:
        return 'gas_station'
    
    # Shopping
    elif (shop or 
          amenity in ['marketplace', 'shopping_centre'] or
          tourism == 'attraction' and 'market' in tags.get('name', '').lower()):
        return 'shopping'
    
    # Recreation
    elif (leisure in ['park', 'playground', 'sports_centre', 'stadium', 'swimming_pool', 'golf_course'] or
          amenity in ['theatre', 'cinema', 'arts_centre'] or
          tourism in ['zoo', 'theme_park']):
        return 'recreation'
    
    # Education
    elif amenity in ['school', 'university', 'college', 'kindergarten', 'library']:
        return 'education'
    
    # Tourism
    elif (tourism in ['attraction', 'museum', 'monument', 'viewpoint', 'gallery', 'information'] or
          amenity in ['place_of_worship'] or
          tags.get('historic')):
        return 'tourism'
    
    # Services
    elif amenity in ['bank', 'atm', 'post_office', 'police', 'fire_station', 'courthouse', 'townhall']:
        return 'services'
    
    return None

def get_description_xml(tags):
    """Generate description from OSM tags for XML parsing"""
    parts = []
    
    if 'amenity' in tags:
        parts.append(f"Amenity: {tags['amenity']}")
    if 'shop' in tags:
        parts.append(f"Shop: {tags['shop']}")
    if 'tourism' in tags:
        parts.append(f"Tourism: {tags['tourism']}")
    if 'addr:street' in tags:
        parts.append(f"Street: {tags['addr:street']}")
    if 'addr:city' in tags:
        parts.append(f"City: {tags['addr:city']}")
    if 'cuisine' in tags:
        parts.append(f"Cuisine: {tags['cuisine']}")
    if 'description' in tags:
        parts.append(tags['description'])
        
    return '; '.join(parts) if parts else 'OSM Point of Interest'

def parse_osm_pbf(file_path, bounds=None, max_pois=None):
    """Parse OSM PBF file using osmium"""
    if not OSMIUM_AVAILABLE:
        raise ImportError("osmium library not available. Install with: pip install osmium")
    
    print(f"🔍 Parsing {file_path} with osmium...")
    handler = POIHandler(bounds, max_pois)
    handler.apply_file(file_path)
    return handler.pois

def parse_osm_xml(file_path, bounds=None, max_pois=None):
    """Parse OSM XML file"""
    print(f"🔍 Parsing {file_path} with XML parser...")
    pois = []
    
    try:
        with open_osm_file(file_path) as file:
            # Use iterparse for large files
            context = ET.iterparse(file, events=('start', 'end'))
            context = iter(context)
            event, root = next(context)
            
            current_node = None
            current_tags = {}
            
            for event, elem in context:
                if event == 'start':
                    if elem.tag == 'node':
                        lat = elem.get('lat')
                        lon = elem.get('lon')
                        if lat and lon:
                            current_node = {
                                'lat': float(lat),
                                'lon': float(lon)
                            }
                            current_tags = {}
                    elif elem.tag == 'tag' and current_node:
                        k = elem.get('k')
                        v = elem.get('v')
                        if k and v:
                            current_tags[k] = v
                
                elif event == 'end':
                    if elem.tag == 'node' and current_node and current_tags:
                        # Check bounds
                        if bounds:
                            min_lat, max_lat, min_lng, max_lng = bounds
                            if not (min_lat <= current_node['lat'] <= max_lat and 
                                   min_lng <= current_node['lon'] <= max_lng):
                                current_node = None
                                current_tags = {}
                                elem.clear()
                                continue
                        
                        # Check if it's a POI
                        category = categorize_poi_xml(current_tags)
                        if category:
                            name = current_tags.get('name', f"Unknown {category.title()}")
                            description = get_description_xml(current_tags)
                            
                            pois.append({
                                'name': name,
                                'category': category,
                                'latitude': current_node['lat'],
                                'longitude': current_node['lon'],
                                'description': description
                            })
                            
                            if len(pois) % 100 == 0:
                                print(f"📍 Extracted {len(pois)} POIs...")
                            
                            if max_pois and len(pois) >= max_pois:
                                break
                        
                        current_node = None
                        current_tags = {}
                    
                    # Clear the element to free memory
                    elem.clear()
                    
    except Exception as e:
        print(f"❌ XML Parse Error: {e}")
        return []
    
    return pois

def write_csv(pois, output_file):
    """Write POIs to CSV file"""
    print(f"💾 Writing {len(pois)} POIs to {output_file}...")
    
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['name', 'category', 'latitude', 'longitude', 'description']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(pois)
    
    print(f"✅ CSV file created: {output_file}")

def main():
    parser = argparse.ArgumentParser(description='Convert Geofabrik OSM data to CSV format')
    parser.add_argument('input_file', help='Input OSM file (.osm, .osm.bz2, .osm.gz, .osm.pbf, or .zip)')
    parser.add_argument('output_file', help='Output CSV file path')
    parser.add_argument('--bounds', nargs=4, type=float, metavar=('MIN_LAT', 'MAX_LAT', 'MIN_LNG', 'MAX_LNG'),
                       help='Limit extraction to specific bounds')
    parser.add_argument('--max-pois', type=int, default=1000,
                       help='Maximum number of POIs to extract (default: 1000)')
    parser.add_argument('--zip', action='store_true', help='Force processing as zip file')
    
    args = parser.parse_args()
    
    print("🚀 Starting Geofabrik data conversion...")
    print(f"📂 Input: {args.input_file}")
    print(f"📄 Output: {args.output_file}")
    print(f"📊 Max POIs: {args.max_pois}")
    if args.bounds:
        print(f"🗺️ Bounds: {args.bounds}")
    print("-" * 50)
    
    input_path = Path(args.input_file)
    
    if not input_path.exists():
        print(f"❌ Error: Input file {args.input_file} does not exist")
        return 1
    
    temp_dir = None
    osm_files = []
    
    try:
        # Handle zip files
        if input_path.suffix == '.zip' or args.zip:
            temp_dir = input_path.parent / 'temp_extract'
            temp_dir.mkdir(exist_ok=True)
            extract_zip_file(str(input_path), str(temp_dir))
            osm_files = find_osm_files(str(temp_dir))
        else:
            osm_files = [str(input_path)]
        
        if not osm_files:
            print("❌ No OSM files found")
            return 1
        
        print(f"📁 Found {len(osm_files)} OSM file(s)")
        
        all_pois = []
        
        for i, osm_file in enumerate(osm_files):
            print(f"\n🔄 Processing file {i+1}/{len(osm_files)}: {Path(osm_file).name}")
            
            try:
                # Determine file type and parse accordingly
                if osm_file.endswith('.pbf'):
                    if not OSMIUM_AVAILABLE:
                        print("❌ Error: osmium library required for PBF files")
                        print("Install with: pip install osmium")
                        return 1
                    pois = parse_osm_pbf(osm_file, args.bounds, args.max_pois - len(all_pois))
                else:
                    pois = parse_osm_xml(osm_file, args.bounds, args.max_pois - len(all_pois))
                
                all_pois.extend(pois)
                print(f"📍 Extracted {len(pois)} POIs from {Path(osm_file).name}")
                
                if args.max_pois and len(all_pois) >= args.max_pois:
                    print(f"🎯 Reached maximum POI limit ({args.max_pois})")
                    break
                    
            except Exception as e:
                print(f"❌ Error processing {osm_file}: {e}")
                continue
        
        if not all_pois:
            print("❌ No POIs extracted from any file")
            return 1
        
        # Write to CSV
        write_csv(all_pois, args.output_file)
        
        # Summary
        categories = {}
        for poi in all_pois:
            categories[poi['category']] = categories.get(poi['category'], 0) + 1
        
        print(f"\n🎉 Conversion completed successfully!")
        print(f"📊 Total POIs extracted: {len(all_pois)}")
        print(f"📋 Categories found:")
        for category, count in sorted(categories.items()):
            print(f"   - {category}: {count}")
        
        return 0
        
    finally:
        # Cleanup temporary directory
        if temp_dir and temp_dir.exists():
            import shutil
            shutil.rmtree(temp_dir)
            print(f"🧹 Cleaned up temporary files")

if __name__ == "__main__":
    sys.exit(main())