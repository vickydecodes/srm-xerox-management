import subprocess
import csv

# Run git log with author and commit hash
result = subprocess.run(
    ['git', 'log', '--all', '--pretty=%an%x09%H', '--numstat'],
    capture_output=True, text=True
)
lines = result.stdout.splitlines()

stats = {}
current_author = None
adds = 0
dels = 0

for line in lines:
    parts = line.split('\t')

    # File change numbers
    if len(parts) == 3 and parts[0].isdigit() and parts[1].isdigit():
        adds += int(parts[0])
        dels += int(parts[1])

    # Author + commit hash
    elif len(parts) == 2:
        if current_author:
            if current_author not in stats:
                stats[current_author] = [0, 0, 0]  # adds, dels, commits
            stats[current_author][0] += adds
            stats[current_author][1] += dels
            stats[current_author][2] += 1

        current_author = parts[0].strip()
        adds = 0
        dels = 0

# Save last author
if current_author:
    if current_author not in stats:
        stats[current_author] = [0, 0, 0]
    stats[current_author][0] += adds
    stats[current_author][1] += dels
    stats[current_author][2] += 1

# Compute totals
total_adds = sum(v[0] for v in stats.values())
total_dels = sum(v[1] for v in stats.values())
total_commits = sum(v[2] for v in stats.values())
total_changes = total_adds + total_dels

# Write CSV
with open('git_summary.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow([
        'Author', 'Additions', 'Deletions', 'Net LOC',
        'Commits', 'Avg Add/Commit', 'Avg Del/Commit',
        'Avg Total/Commit', 'Total Changes', 'Contribution %',
        'Commit %', 'Churn Ratio (del/add)'
    ])

    for author, (a, d, c) in stats.items():
        total = a + d
        net = a - d
        avg_add = a / c if c else 0
        avg_del = d / c if c else 0
        avg_total = total / c if c else 0
        contribution_pct = (total / total_changes * 100) if total_changes else 0
        commit_pct = (c / total_commits * 100) if total_commits else 0
        churn = (d / a) if a else 0

        writer.writerow([
            author, a, d, net, c,
            round(avg_add, 2), round(avg_del, 2), round(avg_total, 2),
            total, round(contribution_pct, 2),
            round(commit_pct, 2), round(churn, 2)
        ])

    # Totals row
    writer.writerow([
        'TOTAL', total_adds, total_dels, total_adds-total_dels,
        total_commits, '', '', '',
        total_changes, '100%', '100%',
        round(total_dels/total_adds, 2) if total_adds else 0
    ])

print("Done! Check git_summary.csv")