#!/usr/bin/env python3
"""
Hiroshima Open Data Collector for Uesugi Engine
This script demonstrates how to access and download datasets from Hiroshima's open data portals
"""

import requests
import pandas as pd
import json
from datetime import datetime
import os
from typing import Dict, List, Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class HiroshimaDataCollector:
    """Collector for Hiroshima Prefecture open data"""
    
    def __init__(self, output_dir: str = "hiroshima_data"):
        """Initialize the data collector
        
        Args:
            output_dir: Directory to save downloaded data
        """
        self.output_dir = output_dir
        self.base_url = "https://hiroshima-opendata.dataeye.jp"
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Known dataset URLs (these would need to be verified/updated)
        self.datasets = {
            "hiroshima_city_population": {
                "id": "899",
                "name": "広島市_地域・年齢別人口",
                "description": "Hiroshima City Population by Region and Age"
            },
            "onomichi_population": {
                "id": "3794", 
                "name": "尾道市_人口・世帯",
                "description": "Onomichi City Population and Households"
            },
            "hatsukaichi_population": {
                "id": "897",
                "name": "廿日市市_地域・年齢別人口", 
                "description": "Hatsukaichi City Population by Region and Age"
            },
            "fuchu_hazard_map": {
                "id": "3658",
                "name": "府中市_土砂災害ハザードマップ",
                "description": "Fuchu City Landslide Hazard Map"
            },
            "air_pollution": {
                "id": "4164",
                "name": "広島県_大気汚染常時監視結果",
                "description": "Hiroshima Prefecture Air Pollution Monitoring"
            }
        }
    
    def fetch_dataset_metadata(self, dataset_id: str) -> Optional[Dict]:
        """Fetch metadata for a specific dataset
        
        Args:
            dataset_id: The dataset ID from the portal
            
        Returns:
            Dataset metadata as dictionary or None if failed
        """
        try:
            # This is a hypothetical API endpoint - actual endpoint would need to be verified
            url = f"{self.base_url}/api/datasets/{dataset_id}"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Failed to fetch metadata for dataset {dataset_id}: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching dataset metadata: {e}")
            return None
    
    def download_dataset(self, dataset_key: str, format: str = "csv") -> Optional[str]:
        """Download a dataset in the specified format
        
        Args:
            dataset_key: Key from self.datasets dictionary
            format: File format (csv, json, excel)
            
        Returns:
            Path to downloaded file or None if failed
        """
        if dataset_key not in self.datasets:
            logger.error(f"Unknown dataset: {dataset_key}")
            return None
            
        dataset = self.datasets[dataset_key]
        dataset_id = dataset["id"]
        
        # Construct download URL (hypothetical - actual URL pattern needs verification)
        download_url = f"{self.base_url}/datasets/{dataset_id}/download.{format}"
        
        try:
            logger.info(f"Downloading {dataset['name']}...")
            response = requests.get(download_url, timeout=60)
            
            if response.status_code == 200:
                # Save file
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"{dataset_key}_{timestamp}.{format}"
                filepath = os.path.join(self.output_dir, filename)
                
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                
                logger.info(f"Successfully downloaded to {filepath}")
                return filepath
            else:
                logger.warning(f"Failed to download {dataset_key}: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error downloading dataset: {e}")
            return None
    
    def fetch_gtfs_data(self) -> Optional[str]:
        """Fetch GTFS transportation data from Hiroshima Bus Association
        
        Returns:
            Path to downloaded GTFS file or None if failed
        """
        gtfs_url = "https://www.bus-kyo.or.jp/gtfs-open-data"
        
        try:
            logger.info("Fetching GTFS transportation data...")
            # This would need proper implementation based on actual GTFS endpoint
            # For now, just return a placeholder
            logger.warning("GTFS download not implemented - needs actual endpoint")
            return None
            
        except Exception as e:
            logger.error(f"Error fetching GTFS data: {e}")
            return None
    
    def process_population_data(self, filepath: str) -> pd.DataFrame:
        """Process downloaded population data
        
        Args:
            filepath: Path to CSV file
            
        Returns:
            Processed DataFrame
        """
        try:
            # Read CSV with Japanese encoding
            df = pd.read_csv(filepath, encoding='shift-jis')
            
            # Basic processing (would need adjustment based on actual data structure)
            logger.info(f"Loaded data with shape: {df.shape}")
            logger.info(f"Columns: {list(df.columns)}")
            
            return df
            
        except Exception as e:
            logger.error(f"Error processing population data: {e}")
            return pd.DataFrame()
    
    def collect_all_datasets(self) -> Dict[str, str]:
        """Download all configured datasets
        
        Returns:
            Dictionary mapping dataset keys to file paths
        """
        results = {}
        
        for key in self.datasets.keys():
            filepath = self.download_dataset(key)
            if filepath:
                results[key] = filepath
            
        return results
    
    def generate_summary_report(self, downloaded_files: Dict[str, str]) -> str:
        """Generate a summary report of downloaded data
        
        Args:
            downloaded_files: Dictionary of dataset keys to file paths
            
        Returns:
            Path to summary report
        """
        report_path = os.path.join(self.output_dir, f"download_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        
        summary = {
            "download_time": datetime.now().isoformat(),
            "total_datasets": len(self.datasets),
            "successful_downloads": len(downloaded_files),
            "datasets": {}
        }
        
        for key, info in self.datasets.items():
            summary["datasets"][key] = {
                "name": info["name"],
                "description": info["description"],
                "downloaded": key in downloaded_files,
                "filepath": downloaded_files.get(key, None)
            }
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Summary report saved to {report_path}")
        return report_path


def main():
    """Main function to demonstrate data collection"""
    
    logger.info("Starting Hiroshima Open Data Collection")
    
    # Initialize collector
    collector = HiroshimaDataCollector()
    
    # Example: Download specific dataset
    logger.info("\n--- Downloading Hiroshima City Population Data ---")
    pop_file = collector.download_dataset("hiroshima_city_population")
    
    if pop_file:
        # Process the data
        df = collector.process_population_data(pop_file)
        logger.info(f"Population data preview:\n{df.head()}")
    
    # Download all datasets
    logger.info("\n--- Downloading All Configured Datasets ---")
    all_files = collector.collect_all_datasets()
    
    # Generate summary report
    report = collector.generate_summary_report(all_files)
    logger.info(f"\nData collection complete. See {report} for details.")
    
    # Try to fetch GTFS data
    logger.info("\n--- Attempting GTFS Data Collection ---")
    gtfs_file = collector.fetch_gtfs_data()
    
    logger.info("\nData collection process finished.")


if __name__ == "__main__":
    main()