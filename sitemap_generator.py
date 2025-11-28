import requests
import datetime
import base64
import re
import os
import urllib.parse
from xml.sax.saxutils import escape

# Configuration
DOMAIN = "https://buffstreams.world"
API_PRIMARY = "https://streamed.pk/api/matches/all"
API_BACKUP = "https://topembed.pw/api.php?format=json"
PROXY_URL = "https://corsproxy.io/?" # Python requests usually don't need CORS proxies, but we keep logic consistent

# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------

def get_current_date_iso():
    """Returns current date in YYYY-MM-DD format."""
    return datetime.datetime.now().strftime("%Y-%m-%d")

def get_first_day_of_month_iso():
    """Returns the first day of the current month in YYYY-MM-DD."""
    now = datetime.datetime.now()
    return now.replace(day=1).strftime("%Y-%m-%d")

def generate_backup_id(event):
    """
    Replicates the JS logic: 
    btoa(unescape(encodeURIComponent(unix_timestamp + "_" + sport + "_" + match_name)))
    """
    match_title = event.get('match') or event.get('event') or ""
    # JS: .toLowerCase().replace(/[^a-z0-9]/g, '')
    safe_match = re.sub(r'[^a-z0-9]', '', match_title.lower())
    
    sport = event.get('sport') or ""
    # JS: .toLowerCase().trim()
    safe_sport = sport.lower().strip()
    
    unix = str(event.get('unix_timestamp'))
    
    unique_string = f"{unix}_{safe_sport}_{safe_match}"
    
    # Python base64 encoding (replicating JS btoa)
    encoded_bytes = base64.b64encode(unique_string.encode('utf-8'))
    return encoded_bytes.decode('utf-8')

def normalize_title(title):
    """Simple normalization for fuzzy deduplication."""
    if not title: return ""
    return re.sub(r'[^a-z0-9]', '', title.lower().replace(" vs ", " v "))

# ---------------------------------------------------------
# CONTENT FETCHING
# ---------------------------------------------------------

def fetch_matches():
    primary_matches = []
    seen_signatures = set() # To store (normalized_title, timestamp) for deduplication

    # 1. Fetch Primary API
    try:
        response = requests.get(API_PRIMARY, timeout=10)
        if response.status_code == 200:
            data = response.json()
            for match in data:
                # Store for sitemap
                match_obj = {
                    'title': match.get('title'),
                    'id': match.get('id'), # Primary uses direct ID
                    'date': match.get('date'), # Timestamp
                    'source': 'primary'
                }
                primary_matches.append(match_obj)
                
                # Add to deduplication set
                norm_title = normalize_title(match.get('title'))
                # We use a rough timestamp window (within 2 hours) for dedup
                timestamp_hour = int(match.get('date')) // 3600 
                seen_signatures.add((norm_title, timestamp_hour))
                
    except Exception as e:
        print(f"Error fetching Primary API: {e}")

    # 2. Fetch Backup API
    backup_matches = []
    try:
        # Python requests handles SSL/Headers better, usually doesn't need the corsproxy
        # But if the API blocks non-browser UAs, we might need headers.
        headers = {'User-Agent': 'Mozilla/5.0'} 
        response = requests.get(API_BACKUP, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data and 'events' in data:
                # The backup API structure is grouped by date strings or lists
                # We need to flatten it
                all_events = []
                if isinstance(data['events'], dict):
                    for key, val in data['events'].items():
                        if isinstance(val, list):
                            all_events.extend(val)
                        else:
                            all_events.append(val)
                elif isinstance(data['events'], list):
                    all_events = data['events']
                
                for event in all_events:
                    # Generate ID
                    generated_id = generate_backup_id(event)
                    
                    # Deduplication Logic
                    title = event.get('match') or event.get('event') or "Unknown"
                    timestamp = int(event.get('unix_timestamp'))
                    norm_title = normalize_title(title)
                    timestamp_hour = timestamp // 3600
                    
                    # If this match looks like one we already have from Primary, SKIP IT
                    if (norm_title, timestamp_hour) in seen_signatures:
                        continue
                    
                    match_obj = {
                        'title': title,
                        'id': generated_id,
                        'date': timestamp * 1000, # Convert sec to ms for consistency if needed, or keep logic separate
                        'source': 'backup'
                    }
                    backup_matches.append(match_obj)
                    
    except Exception as e:
        print(f"Error fetching Backup API: {e}")

    return primary_matches + backup_matches

def get_blog_urls():
    """
    Scans the 'blog' directory for subfolders containing index.html 
    or just hardcodes known blogs if scanning fails.
    """
    blog_urls = []
    blog_dir = 'blog'
    
    if os.path.exists(blog_dir):
        for item in os.listdir(blog_dir):
            item_path = os.path.join(blog_dir, item)
            if os.path.isdir(item_path):
                # Assuming structure: buffstreams.world/blog/Article-Name/
                url = f"{DOMAIN}/blog/{item}/"
                blog_urls.append(url)
            elif item.endswith('.html') and item != 'index.html':
                 # Assuming structure: buffstreams.world/blog/article.html
                 url = f"{DOMAIN}/blog/{item}"
                 blog_urls.append(url)
    
    # Fallback/Hardcoded from your prompt if file scan finds nothing
    if not blog_urls:
        blog_urls = [
            f"{DOMAIN}/blog/Is-Hesgoal-Back/",
            f"{DOMAIN}/blog/Is-NFLBITE-Down/",
            f"{DOMAIN}/blog/Totalsportek-Premier-League-Streams/",
            f"{DOMAIN}/blog/Sportsurge-Not-Working/",
            f"{DOMAIN}/blog/Streameast-Down/"
        ]
    return blog_urls

# ---------------------------------------------------------
# SITEMAP GENERATION
# ---------------------------------------------------------

def generate_xml():
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]

    # Date Calculators
    date_always = get_current_date_iso()
    date_monthly = get_first_day_of_month_iso()

    # 1. STATIC PAGES (High Priority)
    # Homepage
    xml_lines.append(f"""
    <url>
        <loc>{DOMAIN}/</loc>
        <lastmod>{date_always}</lastmod>
        <changefreq>always</changefreq>
        <priority>1.0</priority>
    </url>""")
    
    # Schedule Page
    xml_lines.append(f"""
    <url>
        <loc>{DOMAIN}/Schedule/?popular=true</loc>
        <lastmod>{date_always}</lastmod>
        <changefreq>always</changefreq>
        <priority>0.9</priority>
    </url>""")

    # Other Static Pages (Terms, Contact, etc) - Monthly update
    static_pages = ['About', 'Terms', 'Privacy', 'DMCA', 'Contact', 'Disclaimer']
    for page in static_pages:
        xml_lines.append(f"""
    <url>
        <loc>{DOMAIN}/{page}/</loc>
        <lastmod>{date_monthly}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>""")

    # 2. CATEGORIES (From Homepage Data) - Daily/Always update
    categories = [
        'football', 'basketball', 'american-football', 'hockey', 'baseball', 
        'motor-sports', 'fight', 'tennis', 'rugby', 'golf', 
        'billiards', 'afl', 'darts', 'cricket', 'other'
    ]
    for cat in categories:
        xml_lines.append(f"""
    <url>
        <loc>{DOMAIN}/Schedule/?sport={cat}</loc>
        <lastmod>{date_always}</lastmod>
        <changefreq>always</changefreq>
        <priority>0.8</priority>
    </url>""")

    # 3. BLOG POSTS - Monthly update
    blogs = get_blog_urls()
    for blog_url in blogs:
        xml_lines.append(f"""
    <url>
        <loc>{blog_url}</loc>
        <lastmod>{date_monthly}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>""")

    # 4. MATCHES (Dynamic)
    matches = fetch_matches()
    print(f"Found {len(matches)} total matches (Primary + Backup filtered).")
    
    for match in matches:
        # Construct URL based on your Schedule page logic
        # Your script.js reads "?id=" parameter. 
        # Primary API uses numeric ID, Backup uses Base64 string.
        # Both should be passed to ?id= for the sitemap to lead to the right player setup.
        match_url = f"{DOMAIN}/Schedule/?id={match['id']}"
        match_title = escape(match['title'])
        
        # Date Logic:
        # If match is in future: set date to match date.
        # If match is live/past: set date to today.
        
        try:
            # Handle timestamp (some are ms, some seconds)
            ts = int(match['date'])
            # Normalize to seconds
            if ts > 9999999999: ts = ts / 1000 
            
            match_dt = datetime.datetime.fromtimestamp(ts)
            now = datetime.datetime.now()
            
            # If match is tomorrow, use match date. If today or live, use today.
            if match_dt.date() > now.date():
                final_date = match_dt.strftime("%Y-%m-%d")
            else:
                final_date = date_always # Today
                
        except:
            final_date = date_always

        xml_lines.append(f"""
    <url>
        <loc>{match_url}</loc>
        <lastmod>{final_date}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>""")

    xml_lines.append('</urlset>')
    
    # Write to file
    with open('sitemap.xml', 'w', encoding='utf-8') as f:
        f.write('\n'.join(xml_lines))
    print("Sitemap generated successfully.")

if __name__ == "__main__":
    generate_xml()
