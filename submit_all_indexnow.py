import urllib.request, json, re

domain = "dayront.com"
key = "d6649156d7904ba1b88c94da837b436e"
key_location = f"https://{domain}/{key}.txt"
sitemap_index_url = f"https://{domain}/sitemap-index.xml"

print(f"Fetching sitemap index from: {sitemap_index_url}")
req = urllib.request.Request(sitemap_index_url)
with urllib.request.urlopen(req) as response:
    sitemap_index = response.read().decode()

# Extract sub-sitemap URLs
sub_sitemaps = re.findall(r'<loc>(.*?)</loc>', sitemap_index)
if not sub_sitemaps:
    sub_sitemaps = [sitemap_index_url] 

all_urls = []
for sitemap_url in sub_sitemaps:
    print(f"Fetching: {sitemap_url}")
    req = urllib.request.Request(sitemap_url)
    with urllib.request.urlopen(req) as response:
        sitemap_data = response.read().decode()
    all_urls.extend(re.findall(r'<loc>(.*?)</loc>', sitemap_data))

print(f"Total URLs found: {len(all_urls)}")

# Submit in chunks of 10,000
chunk_size = 10000
for i in range(0, len(all_urls), chunk_size):
    chunk = all_urls[i:i + chunk_size]
    payload = {
        "host": domain,
        "key": key,
        "keyLocation": key_location,
        "urlList": chunk
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        "https://api.indexnow.org/indexnow",
        data=data,
        headers={'Content-Type': 'application/json; charset=utf-8'}
    )
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Submitted {len(chunk)} URLs. Status: {response.status}")
    except urllib.error.HTTPError as e:
        print(f"Error: {e.code} {e.reason}")
        print(e.read().decode())
