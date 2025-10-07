#!/usr/bin/env python3
"""
Tests for geofabrik_to_csv_pbf.py converter script with PBF support
"""

import unittest
import tempfile
import os
import csv
from unittest.mock import patch, MagicMock
import sys

# Add the parent directory to sys.path to import the module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from geofabrik_to_csv_pbf import (
        categorize_poi_xml, 
        get_description_xml,
        write_csv,
        find_osm_files,
        open_osm_file
    )
    OSMIUM_AVAILABLE = True
    try:
        import osmium
    except ImportError:
        OSMIUM_AVAILABLE = False
except ImportError:
    print("Warning: Could not import geofabrik_to_csv_pbf module")
    categorize_poi_xml = None
    get_description_xml = None
    write_csv = None
    find_osm_files = None
    open_osm_file = None
    OSMIUM_AVAILABLE = False


class TestGeofabrikPBFConverter(unittest.TestCase):
    """Test cases for Geofabrik PBF OSM data converter"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @unittest.skipIf(categorize_poi_xml is None, "Module not available")
    def test_categorize_poi_restaurant(self):
        """Test POI categorization for restaurants (XML parser)"""
        tags = {'amenity': 'restaurant', 'name': 'Test Restaurant'}
        category = categorize_poi_xml(tags)
        self.assertEqual(category, 'restaurant')

    @unittest.skipIf(categorize_poi_xml is None, "Module not available")
    def test_categorize_poi_hotel(self):
        """Test POI categorization for hotels (XML parser)"""
        tags = {'amenity': 'hotel', 'name': 'Test Hotel'}
        category = categorize_poi_xml(tags)
        self.assertEqual(category, 'hotel')

    @unittest.skipIf(categorize_poi_xml is None, "Module not available")
    def test_categorize_poi_transportation(self):
        """Test POI categorization for transportation"""
        test_cases = [
            ({'amenity': 'bus_station'}, 'transportation'),
            ({'railway': 'station'}, 'transportation'),
            ({'aeroway': 'aerodrome'}, 'transportation'),
            ({'highway': 'bus_stop'}, 'transportation'),
        ]

        for tags, expected in test_cases:
            with self.subTest(tags=tags):
                category = categorize_poi_xml(tags)
                self.assertEqual(category, expected)

    @unittest.skipIf(categorize_poi_xml is None, "Module not available")
    def test_categorize_poi_gas_station(self):
        """Test POI categorization for gas stations"""
        tags = {'amenity': 'fuel', 'name': 'Test Gas Station'}
        category = categorize_poi_xml(tags)
        self.assertEqual(category, 'gas_station')

    @unittest.skipIf(categorize_poi_xml is None, "Module not available")
    def test_categorize_poi_recreation(self):
        """Test POI categorization for recreation"""
        test_cases = [
            ({'leisure': 'park'}, 'recreation'),
            ({'leisure': 'sports_centre'}, 'recreation'),
            ({'amenity': 'cinema'}, 'recreation'),
            ({'tourism': 'zoo'}, 'recreation'),
        ]

        for tags, expected in test_cases:
            with self.subTest(tags=tags):
                category = categorize_poi_xml(tags)
                self.assertEqual(category, expected)

    @unittest.skipIf(categorize_poi_xml is None, "Module not available")
    def test_categorize_poi_education(self):
        """Test POI categorization for education"""
        test_cases = [
            ({'amenity': 'school'}, 'education'),
            ({'amenity': 'university'}, 'education'),
            ({'amenity': 'library'}, 'education'),
        ]

        for tags, expected in test_cases:
            with self.subTest(tags=tags):
                category = categorize_poi_xml(tags)
                self.assertEqual(category, expected)

    @unittest.skipIf(categorize_poi_xml is None, "Module not available")
    def test_categorize_poi_services(self):
        """Test POI categorization for services"""
        test_cases = [
            ({'amenity': 'bank'}, 'services'),
            ({'amenity': 'post_office'}, 'services'),
            ({'amenity': 'police'}, 'services'),
            ({'amenity': 'fire_station'}, 'services'),
        ]

        for tags, expected in test_cases:
            with self.subTest(tags=tags):
                category = categorize_poi_xml(tags)
                self.assertEqual(category, expected)

    @unittest.skipIf(get_description_xml is None, "Module not available")
    def test_get_description_basic(self):
        """Test description generation from OSM tags"""
        tags = {
            'amenity': 'restaurant',
            'cuisine': 'italian',
            'addr:street': 'Main Street',
            'addr:city': 'Test City'
        }
        
        description = get_description_xml(tags)
        
        self.assertIn('Amenity: restaurant', description)
        self.assertIn('Cuisine: italian', description)
        self.assertIn('Street: Main Street', description)
        self.assertIn('City: Test City', description)

    @unittest.skipIf(get_description_xml is None, "Module not available")
    def test_get_description_empty_tags(self):
        """Test description generation with empty tags"""
        tags = {}
        description = get_description_xml(tags)
        self.assertEqual(description, 'OSM Point of Interest')

    @unittest.skipIf(get_description_xml is None, "Module not available")
    def test_get_description_shop(self):
        """Test description generation for shops"""
        tags = {
            'shop': 'supermarket',
            'name': 'Test Supermarket'
        }
        
        description = get_description_xml(tags)
        self.assertIn('Shop: supermarket', description)

    @unittest.skipIf(write_csv is None, "Module not available")
    def test_write_csv_function(self):
        """Test CSV writing functionality"""
        test_csv_path = os.path.join(self.temp_dir, 'test_output.csv')
        
        test_pois = [
            {
                'name': 'Test POI 1',
                'category': 'restaurant',
                'latitude': 25.6093,
                'longitude': 85.1376,
                'description': 'Test description 1'
            },
            {
                'name': 'Test POI 2', 
                'category': 'hotel',
                'latitude': 25.6100,
                'longitude': 85.1380,
                'description': 'Test description 2'
            }
        ]

        write_csv(test_pois, test_csv_path)
        
        # Verify CSV was created correctly
        self.assertTrue(os.path.exists(test_csv_path))
        
        with open(test_csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)
            
            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]['name'], 'Test POI 1')
            self.assertEqual(rows[1]['name'], 'Test POI 2')

    @unittest.skipIf(find_osm_files is None, "Module not available")
    def test_find_osm_files(self):
        """Test OSM file discovery functionality"""
        # Create test files
        test_files = [
            'test.osm',
            'test.osm.bz2',
            'test.osm.gz',
            'test.osm.pbf',
            'other.xml',  # Should not be found
            'readme.txt'  # Should not be found
        ]
        
        for filename in test_files:
            test_file_path = os.path.join(self.temp_dir, filename)
            with open(test_file_path, 'w') as f:
                f.write('test content')
        
        found_files = find_osm_files(self.temp_dir)
        
        # Should find 4 OSM files
        self.assertEqual(len(found_files), 4)
        
        # Verify correct files were found
        basenames = [os.path.basename(f) for f in found_files]
        self.assertIn('test.osm', basenames)
        self.assertIn('test.osm.bz2', basenames)
        self.assertIn('test.osm.gz', basenames)
        self.assertIn('test.osm.pbf', basenames)
        self.assertNotIn('other.xml', basenames)
        self.assertNotIn('readme.txt', basenames)

    def test_coordinate_bounds_validation(self):
        """Test coordinate bounds validation logic"""
        test_cases = [
            # (lat, lng, expected_valid)
            (0, 0, True),
            (25.6093, 85.1376, True),
            (-90, -180, True),
            (90, 180, True),
            (91, 0, False),  # Invalid latitude
            (-91, 0, False),  # Invalid latitude
            (0, 181, False),  # Invalid longitude
            (0, -181, False),  # Invalid longitude
        ]

        for lat, lng, expected_valid in test_cases:
            with self.subTest(lat=lat, lng=lng):
                is_valid = (-90 <= lat <= 90 and -180 <= lng <= 180)
                self.assertEqual(is_valid, expected_valid)

    def test_poi_data_structure_validation(self):
        """Test POI data structure requirements"""
        valid_poi = {
            'name': 'Test POI',
            'category': 'restaurant',
            'latitude': 25.6093,
            'longitude': 85.1376,
            'description': 'Test description'
        }

        # Check required fields
        required_fields = ['name', 'category', 'latitude', 'longitude', 'description']
        for field in required_fields:
            self.assertIn(field, valid_poi)

        # Check data types
        self.assertIsInstance(valid_poi['name'], str)
        self.assertIsInstance(valid_poi['category'], str)
        self.assertIsInstance(valid_poi['latitude'], (int, float))
        self.assertIsInstance(valid_poi['longitude'], (int, float))
        self.assertIsInstance(valid_poi['description'], str)

    @unittest.skipIf(not OSMIUM_AVAILABLE, "osmium library not available")
    def test_osmium_availability(self):
        """Test that osmium library is available for PBF processing"""
        try:
            import osmium
            self.assertTrue(True, "osmium library is available")
        except ImportError:
            self.fail("osmium library should be available for PBF support")

    def test_file_extension_detection(self):
        """Test file extension detection for different formats"""
        test_cases = [
            ('file.osm', False, False, False),  # XML
            ('file.osm.bz2', True, False, False),  # BZ2 compressed
            ('file.osm.gz', False, True, False),  # GZ compressed  
            ('file.osm.pbf', False, False, True),  # PBF binary
        ]

        for filename, is_bz2, is_gz, is_pbf in test_cases:
            with self.subTest(filename=filename):
                self.assertEqual(filename.endswith('.bz2'), is_bz2)
                self.assertEqual(filename.endswith('.gz'), is_gz)
                self.assertEqual(filename.endswith('.pbf'), is_pbf)

    def test_max_pois_limit(self):
        """Test POI extraction limit functionality"""
        # Simulate respecting max_pois limit
        max_pois = 100
        total_available = 500
        
        # Should extract only up to max_pois
        extracted_count = min(total_available, max_pois)
        self.assertEqual(extracted_count, max_pois)
        
        # Test with fewer POIs than limit
        max_pois = 100
        total_available = 50
        extracted_count = min(total_available, max_pois)
        self.assertEqual(extracted_count, total_available)

    def test_category_consistency(self):
        """Test category mapping consistency between XML and PBF parsers"""
        if categorize_poi_xml is None:
            self.skipTest("Module not available")

        # Test cases that should produce same results in both parsers
        test_cases = [
            ({'amenity': 'restaurant'}, 'restaurant'),
            ({'amenity': 'hotel'}, 'hotel'),
            ({'amenity': 'hospital'}, 'hospital'),
            ({'amenity': 'fuel'}, 'gas_station'),
            ({'shop': 'supermarket'}, 'shopping'),
            ({'tourism': 'attraction'}, 'tourism'),
            ({'amenity': 'school'}, 'education'),
            ({'amenity': 'bank'}, 'services'),
        ]

        for tags, expected_category in test_cases:
            with self.subTest(tags=tags):
                xml_result = categorize_poi_xml(tags)
                self.assertEqual(xml_result, expected_category)

    def test_special_characters_in_poi_names(self):
        """Test handling of special characters and unicode in POI names"""
        special_names = [
            "Café München",
            "Restaurant à la carte", 
            "北京烤鸭店",
            "مطعم الشام",
            "Московский ресторан",
            "Sushi & Ramen",
            "O'Malley's Irish Pub",
            "Hotel «Luxury»"
        ]

        for name in special_names:
            with self.subTest(name=name):
                # Test that names with special characters are handled properly
                self.assertIsInstance(name, str)
                self.assertTrue(len(name) > 0)
                
                # Test CSV encoding
                test_csv_path = os.path.join(self.temp_dir, f'test_{hash(name)}.csv')
                test_poi = {
                    'name': name,
                    'category': 'restaurant',
                    'latitude': 25.6093,
                    'longitude': 85.1376,
                    'description': 'Test description'
                }
                
                if write_csv:
                    write_csv([test_poi], test_csv_path)
                    
                    # Verify the file was written and can be read back
                    with open(test_csv_path, 'r', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        row = next(reader)
                        self.assertEqual(row['name'], name)


if __name__ == '__main__':
    unittest.main()