


async function scrape() {
    const res = await fetch('https://apibay.org/q.php?q=top100&cat=');
    const data = await res.json();
    console.log(data);
}

scrape();