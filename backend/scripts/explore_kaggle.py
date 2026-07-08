import kagglehub
import os, glob

# Download dataset
dataset_path = kagglehub.dataset_download("muhyusuf1112/indonesia-commodity-price-based-piphs-source")
print(f"Dataset path: {dataset_path}")

# List files
for f in sorted(glob.glob(os.path.join(dataset_path, "*.csv")))[:5]:
    print(f"  {os.path.basename(f)}")

csv_files = sorted(glob.glob(os.path.join(dataset_path, "**/*.csv"), recursive=True))
print(f"\nTotal CSV files: {len(csv_files)}")

# Read latest file
import pandas as pd
latest = csv_files[-1]
print(f"\nLatest file: {os.path.basename(latest)}")
df = pd.read_csv(latest)
print(f"Columns: {list(df.columns)}")
print(f"Shape: {df.shape}")
print(df.head(20))
print(f"\nUnique commodities: {df['CommodityName'].unique()}")
print(f"\nUnique provinces: {df['ProvinceName'].nunique()}")
