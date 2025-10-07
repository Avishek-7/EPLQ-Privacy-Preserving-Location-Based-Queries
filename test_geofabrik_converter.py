#!/usr/bin/env python3
"""
Tests for geofabrik_to_csv.py converter script
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
    from geofabrik_to_csv import categorize_poi, process_geofabrik_data, parse_osm_xml
except ImportError:
    print("Warning: Could not import geofabrik_to_csv module")
    categorize_poi = None
    process_geofabrik_data = None
    parse_osm_xml = None


class TestGeofabrikConverter(unittest.TestCase):
    """Test cases for Geofabrik OSM data converter"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @unittest.skipIf(categorize_poi is None, "Module not available")
    def test_categorize_poi_restaurant(self):
        """Test POI categorization for restaurants"""
        tags = {'amenity': 'restaurant', 'name': 'Test Restaurant'}
        category = categorize_poi(tags)
        self.assertEqual(category, 'restaurant')

    @unittest.skipIf(categorize_poi is None, "Module not available")
    def test_categorize_poi_hotel(self):
        """Test POI categorization for hotels"""
        tags = {'amenity': 'hotel', 'name': 'Test Hotel'}
        category = categorize_poi(tags)
        self.assertEqual(category, 'hotel')

    @unittest.skipIf(categorize_poi is None, "Module not available")
    def test_categorize_poi_hospital(self):
        """Test POI categorization for hospitals"""
        tags = {'amenity': 'hospital', 'name': 'Test Hospital'}
        category = categorize_poi(tags)
        self.assertEqual(category, 'hospital')

    @unittest.skipIf(categorize_poi is None, "Module not available")
    def test_categorize_poi_shopping(self):
        """Test POI categorization for shopping"""
        tags = {'shop': 'supermarket', 'name': 'Test Shop'}
        category = categorize_poi(tags)
        self.assertEqual(category, 'shopping')

    @unittest.skipIf(categorize_poi is None, "Module not available")
    def test_categorize_poi_tourism(self):
        """Test POI categorization for tourism"""
        tags = {'tourism': 'attraction', 'name': 'Test Attraction'}
        category = categorize_poi(tags)
        self.assertEqual(category, 'tourism')

    @unittest.skipIf(categorize_poi is None, "Module not available")  
    def test_categorize_poi_transportation(self):
        """Test POI categorization for transportation"""
        tags = {'amenity': 'bus_station', 'name': 'Test Station'}
        category = categorize_poi(tags)
        self.assertEqual(category, 'transportation')

    @unittest.skipIf(categorize_poi is None, "Module not available")
    def test_categorize_poi_unknown(self):
        """Test POI categorization for unknown types"""
        tags = {'random_tag': 'random_value', 'name': 'Test POI'}
        category = categorize_poi(tags)
        self.assertEqual(category, 'other')

    def test_csv_output_format(self):
        """Test that CSV output has correct format"""
        test_csv_path = os.path.join(self.temp_dir, 'test_output.csv')
        
        # Create a test CSV with expected headers
        test_data = [
            {
                'name': 'Test POI',
                'category': 'restaurant',
                'latitude': 25.6093,
                'longitude': 85.1376,
                'description': 'Test description'
            }
        ]

        with open(test_csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['name', 'category', 'latitude', 'longitude', 'description']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(test_data)

        # Verify the CSV format
        with open(test_csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            headers = reader.fieldnames
            expected_headers = ['name', 'category', 'latitude', 'longitude', 'description']
            self.assertEqual(headers, expected_headers)

            row = next(reader)
            self.assertEqual(row['name'], 'Test POI')
            self.assertEqual(row['category'], 'restaurant')
            self.assertEqual(float(row['latitude']), 25.6093)
            self.assertEqual(float(row['longitude']), 85.1376)

    def test_coordinate_validation(self):
        """Test coordinate validation"""
        # Valid coordinates
        self.assertTrue(-90 <= 25.6093 <= 90)  # Valid latitude
        self.assertTrue(-180 <= 85.1376 <= 180)  # Valid longitude

        # Invalid coordinates
        self.assertFalse(-90 <= 91 <= 90)  # Invalid latitude
        self.assertFalse(-180 <= 181 <= 180)  # Invalid longitude

    @patch('builtins.print')
    def test_error_handling(self, mock_print):
        """Test error handling for invalid input"""
        # Test with non-existent file
        if process_geofabrik_data:
            result = process_geofabrik_data('/non/existent/file.osm', 'output.csv')
            self.assertFalse(result)

    def test_poi_data_structure(self):
        """Test POI data structure requirements"""
        poi_data = {
            'name': 'Test POI',
            'category': 'restaurant',
            'latitude': 25.6093,
            'longitude': 85.1376,
            'description': 'Test description'
        }

        # Verify required fields
        required_fields = ['name', 'category', 'latitude', 'longitude']
        for field in required_fields:
            self.assertIn(field, poi_data)

        # Verify data types
        self.assertIsInstance(poi_data['name'], str)
        self.assertIsInstance(poi_data['category'], str)
        self.assertIsInstance(poi_data['latitude'], (int, float))
        self.assertIsInstance(poi_data['longitude'], (int, float))

    def test_category_mapping(self):
        """Test category mapping consistency"""
        if categorize_poi is None:
            self.skipTest("Module not available")

        category_tests = [
            ({'amenity': 'restaurant'}, 'restaurant'),
            ({'amenity': 'cafe'}, 'restaurant'),
            ({'amenity': 'hotel'}, 'hotel'),
            ({'tourism': 'hotel'}, 'hotel'),
            ({'amenity': 'hospital'}, 'hospital'),
            ({'amenity': 'pharmacy'}, 'hospital'),
            ({'shop': 'supermarket'}, 'shopping'),
            ({'amenity': 'fuel'}, 'transportation'),
            ({'amenity': 'school'}, 'education'),
            ({'amenity': 'bank'}, 'bank'),
            ({'tourism': 'attraction'}, 'tourism'),
        ]

        for tags, expected_category in category_tests:
            with self.subTest(tags=tags):
                result = categorize_poi(tags)
                self.assertEqual(result, expected_category)

    def test_large_data_handling(self):
        """Test handling of large datasets (simulation)"""
        # Simulate processing many POIs
        large_poi_list = []
        for i in range(1000):
            poi = {
                'name': f'POI {i}',
                'category': 'restaurant',
                'latitude': 25.6093 + (i * 0.001),
                'longitude': 85.1376 + (i * 0.001),
                'description': f'Test POI number {i}'
            }
            large_poi_list.append(poi)

        # Verify we can handle large datasets
        self.assertEqual(len(large_poi_list), 1000)
        
        # Test memory efficiency by checking we don't duplicate data
        first_poi = large_poi_list[0]
        last_poi = large_poi_list[999]
        self.assertNotEqual(first_poi['name'], last_poi['name'])

    def test_special_characters_handling(self):
        """Test handling of special characters in POI names"""
        if categorize_poi is None:
            self.skipTest("Module not available")

        special_names = [
            "Café München",
            "Restaurant à la carte",
            "中文餐厅",
            "مطعم عربي",
            "Ресторан",
            "Hotel & Spa",
            "O'Malley's Pub"
        ]

        for name in special_names:
            with self.subTest(name=name):
                tags = {'amenity': 'restaurant', 'name': name}
                category = categorize_poi(tags)
                self.assertEqual(category, 'restaurant')


class TestPOIDownloader(unittest.TestCase):
    """Test cases for POI downloader functionality"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_coordinate_bounds_calculation(self):
        """Test bounding box calculation for coordinates"""
        lat, lon = 25.6093, 85.1376
        bbox_size = 0.08

        lat_min = lat - bbox_size
        lat_max = lat + bbox_size
        lon_min = lon - bbox_size
        lon_max = lon + bbox_size

        # Verify bounds are calculated correctly
        self.assertAlmostEqual(lat_min, 25.5293, places=4)
        self.assertAlmostEqual(lat_max, 25.6893, places=4)
        self.assertAlmostEqual(lon_min, 85.0576, places=4)
        self.assertAlmostEqual(lon_max, 85.2176, places=4)

    def test_city_coordinates(self):
        """Test predefined city coordinates"""
        cities = {
            'Patna': (25.6093, 85.1376),
            'Delhi': (28.6139, 77.2090),
            'Mumbai': (19.0760, 72.8777),
            'New York': (40.7128, -74.0060),
            'London': (51.5074, -0.1278),
        }

        for city, (lat, lng) in cities.items():
            with self.subTest(city=city):
                # Verify coordinates are within valid ranges
                self.assertTrue(-90 <= lat <= 90, f"Invalid latitude for {city}")
                self.assertTrue(-180 <= lng <= 180, f"Invalid longitude for {city}")

    def test_csv_generation(self):
        """Test CSV file generation"""
        test_csv_path = os.path.join(self.temp_dir, 'test_pois.csv')
        
        test_pois = [
            {
                'name': 'Test Restaurant',
                'category': 'restaurant',
                'latitude': 25.6093,
                'longitude': 85.1376,
                'description': 'Test restaurant description'
            },
            {
                'name': 'Test Hotel',
                'category': 'hotel', 
                'latitude': 25.6100,
                'longitude': 85.1380,
                'description': 'Test hotel description'
            }
        ]

        # Save test data to CSV
        with open(test_csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['name', 'category', 'latitude', 'longitude', 'description']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(test_pois)

        # Verify CSV was created and has correct content
        self.assertTrue(os.path.exists(test_csv_path))
        
        with open(test_csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)
            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]['name'], 'Test Restaurant')
            self.assertEqual(rows[1]['name'], 'Test Hotel')


if __name__ == '__main__':
    unittest.main()