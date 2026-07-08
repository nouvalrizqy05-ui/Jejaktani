import pandas as pd
import os, glob, json

DATASET_PATH = r"C:\Users\HP\.cache\kagglehub\datasets\muhyusuf1112\indonesia-commodity-price-based-piphs-source\versions\1"
OUTPUT_PATH = r"D:\jejak-tani\backend\data\harga_pihps.json"

# Map Kaggle commodity names to our app's komoditas names
COMMODITY_MAP = {
    "Beras": "Beras",
    "Cabai Merah": "Cabai Merah",
    "Cabai Rawit": "Cabai Rawit",
    "Daging Ayam": "Daging Ayam",
    "Daging Sapi": "Daging Sapi",
    "Telur Ayam": "Telur Ayam",
    "Bawang Merah": "Bawang Merah",
    "Bawang Putih": "Bawang Putih",
    "Minyak Goreng": "Minyak Goreng",
    "Gula Pasir": "Gula Pasir",
}

csv_files = sorted(glob.glob(os.path.join(DATASET_PATH, "*.csv")))
print(f"Found {len(csv_files)} CSV files")

all_records = []

for csv_file in csv_files:
    print(f"Processing: {os.path.basename(csv_file)}")
    df = pd.read_csv(csv_file)
    
    # Get unique commodity name in this file
    commodity_name = df['Commodity_Name'].iloc[0]
    our_name = COMMODITY_MAP.get(commodity_name, commodity_name)
    print(f"  Commodity: {commodity_name} -> {our_name}")
    
    # Calculate national average price per date (avg across all provinces)
    daily_avg = df.groupby('Date_Param')['Price'].mean().reset_index()
    daily_avg.columns = ['tanggal', 'harga_per_kg']
    daily_avg['harga_per_kg'] = daily_avg['harga_per_kg'].round(0).astype(int)
    daily_avg['komoditas'] = our_name
    daily_avg['sumber'] = 'PIHPS - Bank Indonesia'
    
    # Take data from 2022 onwards as requested by user
    daily_avg = daily_avg[daily_avg['tanggal'] >= '2022-01-01']
    
    all_records.extend(daily_avg.to_dict('records'))
    print(f"  Records (2025+): {len(daily_avg)}")

# Sort by date then commodity
all_records.sort(key=lambda r: (r['tanggal'], r['komoditas']))

print(f"\nTotal records: {len(all_records)}")
print(f"Date range: {all_records[0]['tanggal']} to {all_records[-1]['tanggal']}")
print(f"Commodities: {sorted(set(r['komoditas'] for r in all_records))}")

# Save as JSON
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(all_records, f, ensure_ascii=False, indent=2)

print(f"\nSaved to: {OUTPUT_PATH}")
print(f"File size: {os.path.getsize(OUTPUT_PATH) / 1024:.1f} KB")
