#!/usr/bin/env python3
"""
Example: Using Hiroshima Open Data for Policy Analysis with Uesugi Engine
This demonstrates how to use collected data for causal inference and policy effect measurement
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
import json
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns

class HiroshimaPolicyAnalyzer:
    """Analyzer for policy effects using Hiroshima open data"""
    
    def __init__(self):
        """Initialize the policy analyzer"""
        self.data_cache = {}
        
    def load_population_data(self, filepath: str) -> pd.DataFrame:
        """Load and prepare population data for analysis
        
        Args:
            filepath: Path to population CSV file
            
        Returns:
            Processed DataFrame ready for analysis
        """
        # This is a mock implementation - actual implementation would depend on data format
        try:
            # Simulate loading population data
            dates = pd.date_range('2015-01-01', '2023-12-31', freq='M')
            regions = ['中区', '東区', '南区', '西区', '安佐南区', '安佐北区', '安芸区', '佐伯区']
            
            data = []
            for date in dates:
                for region in regions:
                    # Simulate population with some trends
                    base_pop = np.random.randint(50000, 200000)
                    trend = (date.year - 2015) * np.random.randint(-100, 200)
                    seasonal = np.sin(date.month / 12 * 2 * np.pi) * 1000
                    
                    data.append({
                        'date': date,
                        'region': region,
                        'population': base_pop + trend + int(seasonal),
                        'age_0_14': int((base_pop + trend) * 0.12),
                        'age_15_64': int((base_pop + trend) * 0.60),
                        'age_65_plus': int((base_pop + trend) * 0.28)
                    })
            
            df = pd.DataFrame(data)
            return df
            
        except Exception as e:
            print(f"Error loading population data: {e}")
            return pd.DataFrame()
    
    def analyze_demographic_trends(self, df: pd.DataFrame) -> Dict:
        """Analyze demographic trends for policy insights
        
        Args:
            df: Population DataFrame
            
        Returns:
            Dictionary of trend analysis results
        """
        results = {
            'aging_rate': {},
            'population_growth': {},
            'regional_disparities': {}
        }
        
        # Calculate aging rate by region
        for region in df['region'].unique():
            region_data = df[df['region'] == region]
            aging_rate = (region_data['age_65_plus'] / region_data['population'] * 100).mean()
            results['aging_rate'][region] = round(aging_rate, 2)
        
        # Calculate population growth rates
        for region in df['region'].unique():
            region_data = df[df['region'] == region].sort_values('date')
            if len(region_data) > 1:
                start_pop = region_data.iloc[0]['population']
                end_pop = region_data.iloc[-1]['population']
                growth_rate = ((end_pop - start_pop) / start_pop * 100)
                results['population_growth'][region] = round(growth_rate, 2)
        
        # Analyze regional disparities
        latest_data = df[df['date'] == df['date'].max()]
        pop_std = latest_data['population'].std()
        pop_mean = latest_data['population'].mean()
        results['regional_disparities']['coefficient_of_variation'] = round(pop_std / pop_mean, 3)
        
        return results
    
    def simulate_policy_intervention(self, df: pd.DataFrame, 
                                   policy_type: str,
                                   intervention_date: str,
                                   target_regions: List[str]) -> pd.DataFrame:
        """Simulate a policy intervention and its effects
        
        Args:
            df: Original population DataFrame
            policy_type: Type of policy ('childcare_support', 'elderly_care', 'urban_development')
            intervention_date: Date when policy was implemented
            target_regions: List of regions where policy was applied
            
        Returns:
            DataFrame with simulated policy effects
        """
        df_sim = df.copy()
        intervention_date = pd.to_datetime(intervention_date)
        
        # Define policy effects
        policy_effects = {
            'childcare_support': {
                'age_0_14': 0.05,  # 5% increase in young population
                'age_15_64': 0.02,  # 2% increase in working age
                'age_65_plus': 0
            },
            'elderly_care': {
                'age_0_14': 0,
                'age_15_64': 0.01,  # 1% increase (caregivers moving in)
                'age_65_plus': 0.03  # 3% increase (better elderly services)
            },
            'urban_development': {
                'age_0_14': 0.03,
                'age_15_64': 0.05,  # 5% increase (job opportunities)
                'age_65_plus': -0.02  # 2% decrease (urban migration)
            }
        }
        
        effects = policy_effects.get(policy_type, {})
        
        # Apply effects to target regions after intervention date
        for idx, row in df_sim.iterrows():
            if row['date'] >= intervention_date and row['region'] in target_regions:
                for age_group, effect in effects.items():
                    if age_group in df_sim.columns:
                        df_sim.at[idx, age_group] = int(row[age_group] * (1 + effect))
                
                # Recalculate total population
                df_sim.at[idx, 'population'] = (
                    df_sim.at[idx, 'age_0_14'] + 
                    df_sim.at[idx, 'age_15_64'] + 
                    df_sim.at[idx, 'age_65_plus']
                )
        
        return df_sim
    
    def measure_policy_effect(self, df_original: pd.DataFrame,
                            df_intervention: pd.DataFrame,
                            target_regions: List[str],
                            control_regions: List[str],
                            intervention_date: str) -> Dict:
        """Measure policy effect using difference-in-differences approach
        
        Args:
            df_original: Original data without intervention
            df_intervention: Data with simulated intervention
            target_regions: Treatment group regions
            control_regions: Control group regions
            intervention_date: Policy implementation date
            
        Returns:
            Dictionary with policy effect measurements
        """
        intervention_date = pd.to_datetime(intervention_date)
        
        # Calculate average outcomes before and after for both groups
        def get_outcomes(df, regions, before_date):
            before = df[(df['region'].isin(regions)) & (df['date'] < before_date)]
            after = df[(df['region'].isin(regions)) & (df['date'] >= before_date)]
            
            return {
                'before': before['population'].mean(),
                'after': after['population'].mean(),
                'change': after['population'].mean() - before['population'].mean()
            }
        
        # Get outcomes for treatment and control groups
        treatment_outcomes = get_outcomes(df_intervention, target_regions, intervention_date)
        control_outcomes = get_outcomes(df_intervention, control_regions, intervention_date)
        
        # Calculate difference-in-differences
        did_estimate = treatment_outcomes['change'] - control_outcomes['change']
        
        # Calculate percentage effect
        baseline = treatment_outcomes['before']
        percent_effect = (did_estimate / baseline) * 100
        
        return {
            'did_estimate': round(did_estimate, 2),
            'percent_effect': round(percent_effect, 2),
            'treatment_before': round(treatment_outcomes['before'], 2),
            'treatment_after': round(treatment_outcomes['after'], 2),
            'control_before': round(control_outcomes['before'], 2),
            'control_after': round(control_outcomes['after'], 2)
        }
    
    def visualize_policy_impact(self, df_original: pd.DataFrame,
                              df_intervention: pd.DataFrame,
                              target_regions: List[str],
                              control_regions: List[str],
                              intervention_date: str,
                              output_path: str = "policy_impact_visualization.png"):
        """Create visualization of policy impact
        
        Args:
            df_original: Original data
            df_intervention: Data with intervention
            target_regions: Treatment regions
            control_regions: Control regions
            intervention_date: Policy date
            output_path: Path to save visualization
        """
        intervention_date = pd.to_datetime(intervention_date)
        
        # Prepare data for plotting
        def prepare_plot_data(df, regions, label):
            region_data = df[df['region'].isin(regions)]
            grouped = region_data.groupby('date')['population'].mean().reset_index()
            grouped['group'] = label
            return grouped
        
        treatment_data = prepare_plot_data(df_intervention, target_regions, 'Treatment')
        control_data = prepare_plot_data(df_intervention, control_regions, 'Control')
        
        # Combine data
        plot_data = pd.concat([treatment_data, control_data])
        
        # Create plot
        plt.figure(figsize=(12, 6))
        
        for group in ['Treatment', 'Control']:
            group_data = plot_data[plot_data['group'] == group]
            plt.plot(group_data['date'], group_data['population'], 
                    label=group, marker='o', markersize=3)
        
        # Add intervention line
        plt.axvline(x=intervention_date, color='red', linestyle='--', 
                   label='Policy Intervention')
        
        plt.xlabel('Date')
        plt.ylabel('Average Population')
        plt.title('Policy Impact Analysis: Difference-in-Differences')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        plt.savefig(output_path, dpi=300)
        plt.close()
        
        print(f"Visualization saved to {output_path}")
    
    def generate_policy_report(self, analysis_results: Dict, 
                             policy_effects: Dict,
                             output_path: str = "policy_analysis_report.json"):
        """Generate comprehensive policy analysis report
        
        Args:
            analysis_results: Demographic analysis results
            policy_effects: Policy effect measurements
            output_path: Path to save report
        """
        report = {
            "analysis_date": datetime.now().isoformat(),
            "data_source": "Hiroshima Open Data Portal",
            "demographic_analysis": analysis_results,
            "policy_impact": policy_effects,
            "recommendations": []
        }
        
        # Generate recommendations based on analysis
        if analysis_results['aging_rate']:
            max_aging_region = max(analysis_results['aging_rate'], 
                                 key=analysis_results['aging_rate'].get)
            report['recommendations'].append({
                "type": "aging_society",
                "priority_region": max_aging_region,
                "recommendation": f"Consider elderly care policies for {max_aging_region} with {analysis_results['aging_rate'][max_aging_region]}% aging rate"
            })
        
        if policy_effects.get('percent_effect', 0) > 0:
            report['recommendations'].append({
                "type": "policy_success",
                "effect_size": policy_effects['percent_effect'],
                "recommendation": f"Policy showed {policy_effects['percent_effect']}% positive effect - consider expansion"
            })
        
        # Save report
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"Policy analysis report saved to {output_path}")
        return report


def main():
    """Demonstrate policy analysis with Hiroshima data"""
    
    print("=== Hiroshima Policy Analysis Example ===\n")
    
    # Initialize analyzer
    analyzer = HiroshimaPolicyAnalyzer()
    
    # Load population data (simulated for this example)
    print("1. Loading population data...")
    df_population = analyzer.load_population_data("simulated_data.csv")
    print(f"   Loaded {len(df_population)} records")
    
    # Analyze demographic trends
    print("\n2. Analyzing demographic trends...")
    trends = analyzer.analyze_demographic_trends(df_population)
    print(f"   Average aging rates by region:")
    for region, rate in trends['aging_rate'].items():
        print(f"   - {region}: {rate}%")
    
    # Simulate policy intervention
    print("\n3. Simulating childcare support policy...")
    target_regions = ['中区', '東区', '南区']
    control_regions = ['西区', '安佐南区', '安佐北区']
    intervention_date = '2020-04-01'
    
    df_with_policy = analyzer.simulate_policy_intervention(
        df_population,
        policy_type='childcare_support',
        intervention_date=intervention_date,
        target_regions=target_regions
    )
    
    # Measure policy effects
    print("\n4. Measuring policy effects using difference-in-differences...")
    policy_effects = analyzer.measure_policy_effect(
        df_population,
        df_with_policy,
        target_regions,
        control_regions,
        intervention_date
    )
    
    print(f"   DiD Estimate: {policy_effects['did_estimate']}")
    print(f"   Percentage Effect: {policy_effects['percent_effect']}%")
    
    # Create visualization
    print("\n5. Creating policy impact visualization...")
    analyzer.visualize_policy_impact(
        df_population,
        df_with_policy,
        target_regions,
        control_regions,
        intervention_date
    )
    
    # Generate report
    print("\n6. Generating comprehensive policy report...")
    report = analyzer.generate_policy_report(trends, policy_effects)
    
    print("\n=== Analysis Complete ===")
    print("Generated files:")
    print("- policy_impact_visualization.png")
    print("- policy_analysis_report.json")


if __name__ == "__main__":
    main()