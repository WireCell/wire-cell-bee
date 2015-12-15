# LOGIN_URL=http://www.phy.bnl.gov/wire-cell/bee
LOGIN_URL=localhost:8000
COOKIES=cookies.txt
CURL_BIN="curl -s -c $COOKIES -b $COOKIES -e $LOGIN_URL"

$CURL_BIN $LOGIN_URL > /dev/null
echo -n "Django Auth: get csrftoken ... "
DJANGO_TOKEN="$(grep csrftoken $COOKIES | sed 's/^.*csrftoken\s*//')"
echo $DJANGO_TOKEN

FILENAME=$1
echo "uploading file $FILENAME ... "
UUID="$($CURL_BIN \
    -H "X-CSRFToken: $DJANGO_TOKEN" \
    -F "file=@$FILENAME" \
    $LOGIN_URL/upload/)"

echo "Please redirect your browser to:"
echo "$LOGIN_URL/set/$UUID/event/list/"

rm $COOKIES