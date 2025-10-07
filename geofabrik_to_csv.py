#!/usr/bin/env python3
"""
Geofabrik OSM Data to CSV Converter
Converts OSM data downloaded from Geofabrik to CSV format for EPLQ project
"""

import os
import sys
import zipfile
import xml.etree.ElementTree as ET
import csv
from pathlib import Path

def extract_zip_file(zip_path, extract_to):
    """Extract zip file to specified directory"""
    print(f"📦 Extracting {zip_path}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)
    print(f"✅ Extracted to {extract_to}")

def find_osm_files(directory):
    """Find all .osm files in directory"""
    osm_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.osm') or file.endswith('.osm.bz2') or file.endswith('.osm.pbf'):
                osm_files.append(os.path.join(root, file))
    return osm_files

def categorize_poi(tags):
    """Categorize POI based on OSM tags"""
    amenity = tags.get('amenity', '')
    shop = tags.get('shop', '')
    tourism = tags.get('tourism', '')
    healthcare = tags.get('healthcare', '')
    
    # Restaurant/Food
    if amenity in ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'food_court']:
        return 'restaurant'
    
    # Hotel/Accommodation
    elif amenity in ['hotel', 'guest_house', 'hostel', 'motel'] or tourism in ['hotel', 'hostel', 'guest_house']:
        return 'hotel'
    
    # Healthcare
    elif amenity in ['hospital', 'clinic', 'pharmacy', 'dentist', 'doctors'] or healthcare:
        return 'hospital'
    
    # Transportation
    elif amenity in ['bus_station', 'taxi', 'fuel', 'parking', 'ferry_terminal']:
        return 'transportation'
    
    # Education
    elif amenity in ['school', 'university', 'college', 'library']:
        return 'education'
    
    # Shopping
    elif shop or amenity in ['marketplace', 'mall']:
        return 'shopping'
    
    # Banking
    elif amenity in ['bank', 'atm']:
        return 'bank'
    
    # Emergency
    elif amenity in ['police', 'fire_station', 'hospital']:
        return 'emergency'
    
    # Tourism
    elif tourism in ['attraction', 'museum', 'gallery', 'zoo', 'theme_park']:
        return 'tourism'
    
    # Entertainment
    elif amenity in ['cinema', 'theatre', 'casino', 'nightclub']:
        return 'entertainment'
    
    else:
        return 'other'

def parse_osm_xml(osm_file, output_csv, max_pois=1000):
    """Parse OSM XML file and extract POIs to CSV"""
    print(f"🔍 Parsing {osm_file}...")
    
    pois = []
    poi_count = 0
    
    try:
        # Parse XML incrementally to handle large files
        context = ET.iterparse(osm_file, events=('start', 'end'))
        context = iter(context)
        event, root = next(context)
        
        current_element = None
        current_tags = {}
        current_lat = None
        current_lon = None
        
        for event, elem in context:
            if event == 'start':
                if elem.tag == 'node':
                    current_lat = elem.get('lat')
                    current_lon = elem.get('lon')
                    current_tags = {}
                    current_element = 'node'
                elif elem.tag == 'way':
                    current_tags = {}
                    current_element = 'way'
                elif elem.tag == 'tag' and current_element:
                    k = elem.get('k')
                    v = elem.get('v')
                    if k and v:
                        current_tags[k] = v
            
            elif event == 'end':
                if elem.tag == 'node' and current_lat and current_lon:
                    # Check if this node has POI tags
                    name = current_tags.get('name', '')
                    if name and (current_tags.get('amenity') or 
                               current_tags.get('shop') or 
                               current_tags.get('tourism') or 
                               current_tags.get('healthcare')):
                        
                        category = categorize_poi(current_tags)
                        description = current_tags.get('amenity', '') or current_tags.get('shop', '') or current_tags.get('tourism', '')
                        
                        # Add cuisine info if available
                        if current_tags.get('cuisine'):
                            description += f" ({current_tags['cuisine']})"
                        
                        poi = {
                            'name': name.strip(),
                            'category': category,
                            'latitude': float(current_lat),
                            'longitude': float(current_lon),
                            'description': description.strip()
                        }
                        
                        pois.append(poi)
                        poi_count += 1
                        
                        if poi_count >= max_pois:
                            break
                
                # Clear processed elements to save memory
                elem.clear()
                if elem.tag == 'node' or elem.tag == 'way':
                    current_element = None
                    current_tags = {}
                    current_lat = None
                    current_lon = None
        
        # Clear root to free memory
        root.clear()
        
    except ET.ParseError as e:
        print(f"❌ XML Parse Error: {e}")
        return 0
    except Exception as e:
        print(f"❌ Error parsing file: {e}")
        return 0
    
    # Write to CSV
    if pois:
        with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['name', 'category', 'latitude', 'longitude', 'description']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(pois)
        
        print(f"✅ Extracted {len(pois)} POIs to {output_csv}")
        
        # Show category breakdown
        categories = {}
        for poi in pois:
            cat = poi['category']
            categories[cat] = categories.get(cat, 0) + 1
        
        print("\n📊 POI Categories:")
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            print(f"  {count:3d} {cat}")
        
        return len(pois)
    else:
        print("⚠️ No POIs found in the file")
        return 0

def process_geofabrik_data(zip_or_osm_path, output_csv="extracted_pois.csv", max_pois=1000):
    """Process Geofabrik data (zip or osm file) and convert to CSV"""
    
    input_path = Path(zip_or_osm_path)
    
    if not input_path.exists():
        print(f"❌ File not found: {zip_or_osm_path}")
        return False
    
    temp_dir = "temp_osm_extract"
    
    try:
        # Handle zip files
        if input_path.suffix.lower() == '.zip':
            os.makedirs(temp_dir, exist_ok=True)
            extract_zip_file(str(input_path), temp_dir)
            osm_files = find_osm_files(temp_dir)
        else:
            # Direct OSM file
            osm_files = [str(input_path)]
        
        if not osm_files:
            print("❌ No OSM files found")
            return False
        
        print(f"📁 Found {len(osm_files)} OSM file(s)")
        
        total_pois = 0
        all_pois = []
        
        # Process each OSM file
        for i, osm_file in enumerate(osm_files):
            print(f"\n🔄 Processing file {i+1}/{len(osm_files)}: {os.path.basename(osm_file)}")
            
            temp_csv = f"temp_pois_{i}.csv"
            pois_extracted = parse_osm_xml(osm_file, temp_csv, max_pois - total_pois)
            
            # Read the temporary CSV and add to all_pois
            if pois_extracted > 0:
                with open(temp_csv, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        all_pois.append(row)
                os.remove(temp_csv)
                
                total_pois += pois_extracted
                if total_pois >= max_pois:
                    print(f"📊 Reached maximum POI limit: {max_pois}")
                    break
        
        # Write final CSV
        if all_pois:
            with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['name', 'category', 'latitude', 'longitude', 'description']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(all_pois)
            
            print(f"\n🎉 Successfully created {output_csv} with {len(all_pois)} POIs!")
            return True
        else:
            print("❌ No POIs extracted from any file")
            return False
    
    finally:
        # Cleanup temporary directory
        if os.path.exists(temp_dir):
            import shutil
            shutil.rmtree(temp_dir)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 geofabrik_to_csv.py <zip_or_osm_file> [output.csv] [max_pois]")
        print("\nExample:")
        print("  python3 geofabrik_to_csv.py bihar-latest.osm.pbf patna_pois.csv 500")
        print("  python3 geofabrik_to_csv.py india-latest.zip india_pois.csv 1000")
        return
    
    input_file = sys.argv[1]
    output_csv = sys.argv[2] if len(sys.argv) > 2 else "extracted_pois.csv"
    max_pois = int(sys.argv[3]) if len(sys.argv) > 3 else 1000
    
    print(f"🚀 Starting Geofabrik data conversion...")
    print(f"📂 Input: {input_file}")
    print(f"📄 Output: {output_csv}")
    print(f"📊 Max POIs: {max_pois}")
    print("-" * 50)
    
    success = process_geofabrik_data(input_file, output_csv, max_pois)
    
    if success:
        print(f"\n✅ Conversion completed successfully!")
        print(f"📁 CSV file ready: {output_csv}")
        print(f"💡 You can now upload this file in the EPLQ admin dashboard")
    else:
        print(f"\n❌ Conversion failed")

if __name__ == "__main__":
    main()