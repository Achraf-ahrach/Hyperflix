import requests
from urllib.parse import quote_plus

def get_trackers():
    trackers = set()
    try:
        response = requests.get(
            "https://raw.githubusercontent.com/XIU2/TrackersListCollection/refs/heads/master/best.txt"
        )
        if response.status_code == 200:
            trackers.update(response.text.strip().split('\n'))
    except Exception as e:
        logging.error(f"Error getting first trackers {e}")
    
    try:
        response = requests.get(
            "https://raw.githubusercontent.com/ngosang/trackerslist/refs/heads/master/trackers_best.txt"
        )
        if response.status_code == 200:
            trackers.update(response.text.strip().split('\n'))
    except Exception as e:
        logging.error(f"Error getting second trackers {e}")
    
    tmp_trackers = [
        "udp://tracker.opentrackr.org:1337/announce",
        "udp://open.demonii.com:1337/announce",
        "udp://open.stealth.si:80/announce",
        "udp://tracker.torrent.eu.org:451/announce",
        "udp://tracker.skyts.net:6969/announce",
        "udp://tracker.dump.cl:6969/announce",
        "udp://ns-1.x-fins.com:6969/announce",
        "udp://explodie.org:6969/announce",
        "udp://exodus.desync.com:6969/announce",
        "http://www.torrentsnipe.info:2701/announce",
        "http://tracker810.xyz:11450/announce",
        "http://tracker.xiaoduola.xyz:6969/announce",
        "http://tracker.sbsub.com:2710/announce",
        "http://tracker.corpscorp.online:80/announce",
        "http://tracker.bz:80/announce",
        "http://share.hkg-fansub.info:80/announce.php",
        "http://seeders-paradise.org:80/announce",
        "http://home.yxgz.club:6969/announce",
        "http://finbytes.org:80/announce.php",
        "http://buny.uk:6969/announce",
    ]
    if not trackers:
        trackers.update(fallback_trackers)
    return list(trackers)

def make_magnet_link(magnet_link):
    trackers = get_trackers()
    result = "&".join(f"tr={quote_plus(tracker)}" for tracker in trackers)
    return f"{magnet_link}&{result}"