#! /bin/bash

if ! [ -d .git ]
then
  echo "Not a git repository!!!"
  exit 1
fi

IMAGE=sergeyitsib/hyper-dex-swap-node
VERSION=$(git tag --sort=version:refname | tail -1)

docker build -t $IMAGE .
docker tag $IMAGE $IMAGE:$VERSION

echo "== To publish"
echo "   docker push $IMAGE:latest; docker push $IMAGE:$VERSION"
