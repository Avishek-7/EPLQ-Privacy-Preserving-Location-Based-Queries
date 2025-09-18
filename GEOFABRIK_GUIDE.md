# Geofabrik Data Processing Guide

This guide explains how to process OpenStreetMap data from Geofabrik for use with the EPLQ Privacy-Preserving Location-Based Queries system.

## Prerequisites

- Python 3.7 or higher
- The `geofabrik_to_csv.py` script (included in project root)

## Step 1: Download Geofabrik Data

1. Visit [Geofabrik Downloads](https://download.geofabrik.de/)
2. Navigate to your region (e.g., Asia → India → Bihar for Patna region)
3. Download the `.osm.pbf` or `.osm.bz2` file
4. Alternatively, you can download city-specific extracts from [BBBike](https://extract.bbbike.org/)

## Step 2: Convert to CSV

Use the provided Python script to convert OSM data to CSV format:

```bash
# Basic usage - processes entire file
python geofabrik_to_csv.py input_file.osm.pbf output_file.csv

# With coordinate bounds (recommended for large files)
python geofabrik_to_csv.py input_file.osm.pbf output_file.csv --bounds 25.5 25.7 85.0 85.3

# Extract from zip file and convert
python geofabrik_to_csv.py input_file.zip output_file.csv

# Limit number of POIs (for testing)
python geofabrik_to_csv.py input_file.osm.pbf output_file.csv --max-pois 1000
```

### Parameters:
- `--bounds`: Limit to specific lat/lng bounds (min_lat max_lat min_lng max_lng)
- `--max-pois`: Limit total number of POIs extracted
- `--zip`: Force processing as zip file

## Step 3: Upload CSV Data

1. Open the EPLQ application
2. Log in as admin
3. Navigate to Data Upload section
4. Click "Select CSV File" and choose your generated CSV
5. The system will automatically encrypt and upload the POI data

## POI Categories Supported

The script extracts and categorizes the following POI types:

- **Hotels**: accommodation, hotel, motel, hostel, guest_house
- **Restaurants**: restaurant, cafe, fast_food, food_court, bar, pub
- **Shopping**: shop, mall, market, supermarket, convenience
- **Hospitals**: hospital, clinic, pharmacy, doctor
- **Gas Stations**: fuel, gas_station, charging_station
- **Transportation**: bus_station, train_station, airport, subway_entrance
- **Recreation**: park, playground, garden, sports_centre, stadium
- **Education**: school, university, college, kindergarten
- **Tourism**: tourism, attraction, monument, museum
- **Services**: bank, atm, post_office, police, fire_station

## Example Workflow

```bash
# Example: Processing Bihar region data for Patna area
wget https://download.geofabrik.de/asia/india/bihar-latest.osm.pbf
python geofabrik_to_csv.py bihar-latest.osm.pbf patna_pois.csv --bounds 25.5 25.7 85.0 85.3 --max-pois 5000
```

This will create a CSV file with up to 5000 POIs from the Patna area, ready for upload to the EPLQ system.

## CSV Format

The generated CSV will have the following columns:
- `name`: POI name
- `category`: Standardized category
- `latitude`: Latitude coordinate
- `longitude`: Longitude coordinate  
- `description`: Additional details (amenity type, address if available)

## Notes

- Large OSM files can take several minutes to process
- Using coordinate bounds significantly reduces processing time
- The script automatically handles compressed files (.bz2, .gz, .zip)
- POIs without names are given default names based on their category
- Coordinates are validated to ensure they're within reasonable ranges

## Troubleshooting

**"No POIs found"**: Try increasing the coordinate bounds or removing the `--max-pois` limit

**Memory issues**: Use coordinate bounds to limit the area being processed

**Slow processing**: Consider using city-specific extracts instead of country/state-level files

For help with the converter script:
```bash
python geofabrik_to_csv.py --help
```