#!/bin/bash

# Check if all required arguments are provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <commit-id> <base-branch> <new-branch-name>"
    echo "Example: $0 e07a0dfa8f8bb673d6d37337adead743651123a9 develop bug-fix-for-develop"
    exit 1
fi

COMMIT_ID=$1
BASE_BRANCH=$2
NEW_BRANCH=$3

echo "===== Starting cherry-pick workflow ====="
echo "Commit ID: $COMMIT_ID"
echo "Base branch: $BASE_BRANCH"
echo "New branch: $NEW_BRANCH"

# Save the current branch to return to it later if needed
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Check if the commit exists
if ! git cat-file -e $COMMIT_ID^{commit} 2>/dev/null; then
    echo "Error: Commit $COMMIT_ID does not exist or is not accessible"
    exit 1
fi

# Check out the base branch and update it
echo "Checking out $BASE_BRANCH branch..."
if ! git checkout $BASE_BRANCH; then
    echo "Error: Failed to checkout $BASE_BRANCH branch"
    git checkout $CURRENT_BRANCH
    exit 1
fi

echo "Pulling latest changes from $BASE_BRANCH..."
if ! git pull; then
    echo "Error: Failed to pull latest changes from $BASE_BRANCH"
    git checkout $CURRENT_BRANCH
    exit 1
fi

# Create and checkout a new branch
echo "Creating new branch $NEW_BRANCH from $BASE_BRANCH..."
if ! git checkout -b $NEW_BRANCH; then
    echo "Error: Failed to create and checkout branch $NEW_BRANCH"
    git checkout $CURRENT_BRANCH
    exit 1
fi

# Cherry-pick the commit
echo "Cherry-picking commit $COMMIT_ID..."
if ! git cherry-pick $COMMIT_ID; then
    echo "Error: Cherry-pick failed. You may need to resolve conflicts manually."
    echo "After resolving conflicts, run: git cherry-pick --continue"
    echo "To abort and return to the previous state, run: git cherry-pick --abort"
    exit 1
fi

# Push the new branch to origin
echo "Pushing $NEW_BRANCH to remote..."
if ! git push -u origin $NEW_BRANCH; then
    echo "Error: Failed to push branch $NEW_BRANCH to remote"
    exit 1
fi

echo "===== Cherry-pick workflow completed successfully ====="
echo "New branch '$NEW_BRANCH' has been created with the cherry-picked commit."
echo "You can now create a PR from $NEW_BRANCH to $BASE_BRANCH"
echo "PR URL: $(git remote get-url origin | sed 's/\.git$//')/compare/$BASE_BRANCH...$NEW_BRANCH"
