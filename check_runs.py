#!/usr/bin/env python3
import sys
import json
import subprocess

def get_github_actions_runs():
    """Fetch GitHub Actions runs for vuongtu1k9-ship-it/Kotlin"""
    try:
        result = subprocess.run(
            ["gh", "api", "repos/vuongtu1k9-ship-it/Kotlin/actions/runs"],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode != 0:
            print(f"Error fetching runs: {result.stderr}")
            return None
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Exception fetching runs: {e}")
        return None

def delete_failing_runs(runs_data):
    """Delete failing runs and return list of deleted run IDs"""
    if not runs_data or 'workflow_runs' not in runs_data:
        return []
    
    failing_runs = [r for r in runs_data['workflow_runs'] if r.get('conclusion') == 'failure']
    deleted_ids = []
    
    for run in failing_runs:
        run_id = run.get('id')
        try:
            subprocess.run(
                ["gh", "api", "-X", "DELETE", f"repos/vuongtu1k9-ship-it/Kotlin/actions/runs/{run_id}"],
                capture_output=True,
                timeout=15
            )
            deleted_ids.append(run_id)
            print(f"Deleted failing run ID: {run_id}")
        except Exception as e:
            print(f"Failed to delete run {run_id}: {e}")
    
    return deleted_ids

def main():
    print("Fetching GitHub Actions runs for vuongtu1k9-ship-it/Kotlin...")
    runs_data = get_github_actions_runs()
    
    if not runs_data:
        print("Failed to fetch runs data")
        return
    
    total_runs = len(runs_data.get('workflow_runs', []))
    print(f"Total runs found: {total_runs}")
    
    # Show recent runs
    for i, run in enumerate(runs_data.get('workflow_runs', [])[:5]):
        print(f"Run {i+1}: ID={run.get('id')}, Status={run.get('status')}, Conclusion={run.get('conclusion')}, Branch={run.get('head_branch')}, Title={run.get('display_title')}")
    
    # Check for failing runs
    failing_runs = [r for r in runs_data.get('workflow_runs', []) if r.get('conclusion') == 'failure']
    
    if failing_runs:
        print(f"\nFound {len(failing_runs)} failing runs")
        deleted_ids = delete_failing_runs(runs_data)
        
        if deleted_ids:
            print(f"\nDeleted {len(deleted_ids)} failing runs: {', '.join(map(str, deleted_ids))}")
        else:
            print("No failing runs to delete")
    else:
        print("\nNo failing runs found")

if __name__ == "__main__":
    main()
