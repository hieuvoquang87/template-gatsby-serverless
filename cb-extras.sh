#!/bin/sh
export GIT_BRANCH="$(echo $CODEBUILD_WEBHOOK_HEAD_REF | sed -e "s/^refs\/heads\///" | sed "s/\-.*//g")"
export GIT_CLEAN_BRANCH="$(echo $GIT_BRANCH | tr '/' '.')"
export GIT_ESCAPED_BRANCH="$(echo $GIT_CLEAN_BRANCH | sed -e 's/[]\/$*.^[]/\\\\&/g')"

export PULL_REQUEST=false
if [ "${GIT_BRANCH#pr-}" != "$GIT_BRANCH" ] ; then
  export PULL_REQUEST=${GIT_BRANCH#pr-};
fi

export BUILD_URL=https://$AWS_DEFAULT_REGION.console.aws.amazon.com/codebuild/home?region=$AWS_DEFAULT_REGION#/builds/$BUILD_ID/view/new

export BRANCH_IDENTIFIER="$(echo $GIT_BRANCH | sed 's/\-.*//g')"

echo "==> AWS CodeBuild Extra Environment Variables:"
echo "==> GIT_BRANCH = $GIT_BRANCH"
echo "==> GIT_CLEAN_BRANCH = $GIT_CLEAN_BRANCH"
echo "==> GIT_ESCAPED_BRANCH = $GIT_ESCAPED_BRANCH"
echo "==> PULL_REQUEST = $PULL_REQUEST"
echo "==> BRANCH_IDENTIFIER = $BRANCH_IDENTIFIER"

echo "export BRANCH_IDENTIFIER=${BRANCH_IDENTIFIER}" >> env.sh
echo "export GIT_BRANCH=${GIT_BRANCH}" >> env.sh
