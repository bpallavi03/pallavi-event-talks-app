import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        req = urllib.request.Request(
            FEED_URL,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        
        # Atom feed namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        entries = root.findall('.//atom:entry', ns)
        
        parsed_entries = []
        
        for entry in entries:
            entry_id = entry.find('atom:id', ns)
            entry_id_text = entry_id.text if entry_id is not None else ""
            
            title = entry.find('atom:title', ns)
            date_text = title.text if title is not None else "Unknown Date"
            
            updated = entry.find('atom:updated', ns)
            updated_text = updated.text if updated is not None else ""
            
            content_node = entry.find('atom:content', ns)
            if content_node is None or not content_node.text:
                continue
                
            content_html = content_node.text
            
            # Parse individual items in the content
            # The release notes use <h3>[Type]</h3> followed by paragraphs
            matches = list(re.finditer(r'<h3>(.*?)</h3>', content_html))
            items = []
            
            if not matches:
                # Fallback if no <h3> tags are found
                plain_text = re.sub(r'<[^>]+>', '', content_html)
                plain_text = ' '.join(plain_text.split())
                items.append({
                    "type": "Update",
                    "html_content": content_html,
                    "plain_text": plain_text
                })
            else:
                for i in range(len(matches)):
                    start = matches[i].end()
                    end = matches[i+1].start() if i + 1 < len(matches) else len(content_html)
                    item_type = matches[i].group(1).strip()
                    body_html = content_html[start:end].strip()
                    
                    # Create clean plain text for tweeting
                    plain_text = re.sub(r'<[^>]+>', '', body_html)
                    plain_text = ' '.join(plain_text.split())
                    
                    items.append({
                        "type": item_type,
                        "html_content": body_html,
                        "plain_text": plain_text
                    })
            
            parsed_entries.append({
                "id": entry_id_text,
                "date": date_text,
                "updated": updated_text,
                "items": items
            })
            
        return parsed_entries, None
    except Exception as e:
        return None, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    # We fetch it dynamically
    entries, error = fetch_and_parse_feed()
    if error:
        return jsonify({"success": False, "error": error}), 500
    return jsonify({"success": True, "data": entries})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
