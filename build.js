const fs = require('fs');
const path = require('path');


function parseDate(dateStr) {
    // Format: DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Months are 0-indexed
        const year = parseInt(parts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }
    return null;
}

function formatDateFrench(date) {
    if (!date) return '';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

function generatePage(txtFilename, htmlFilename, placeholder, containerId, renderer) {
    const txtPath = path.join(__dirname, txtFilename);
    const htmlPath = path.join(__dirname, htmlFilename);

    try {
        if (!fs.existsSync(txtPath)) {
            console.log(`Skipping ${txtFilename}: file not found.`);
            return;
        }

        const rawContent = fs.readFileSync(txtPath, 'utf8');
        const blocks = rawContent.split(/\n\s*\n/);
        let generatedHTML = '';

        blocks.forEach(block => {
            const lines = block.trim().split('\n');
            if (lines.length < 1 || lines[0].trim().startsWith('<!--')) return;

            generatedHTML += renderer(lines);
        });

        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        const startMarker = `<!-- START_${containerId.toUpperCase()} -->`;
        const endMarker = `<!-- END_${containerId.toUpperCase()} -->`;
        const wrappedContent = `${startMarker}\n${generatedHTML}\n${endMarker}`;

        // 1. Try to find existing markers
        const markerRegex = new RegExp(`(${startMarker})([\\s\\S]*?)(${endMarker})`);
        if (markerRegex.test(htmlContent)) {
            htmlContent = htmlContent.replace(markerRegex, wrappedContent);
            console.log(`Updated ${htmlFilename} via marker replacement.`);
        }
        // 2. Try to find placeholder
        else if (htmlContent.includes(placeholder)) {
            htmlContent = htmlContent.replace(placeholder, wrappedContent);
            console.log(`Updated ${htmlFilename} via placeholder replacement.`);
        }
        // 3. Fallback: Try to inject into empty container or replace content if we can safely identify it
        // This is risky with nested divs, so we'll try to be careful or just warn.
        // For now, let's assume if we can't find markers or placeholder, we might need to reset the file.
        else {
            const regex = new RegExp(`(<div id="${containerId}">)([\\s\\S]*?)(<\/div>)`);
            // NOTE: This regex is fragile with nested divs. 
            // If we are here, it means the user might have deleted markers.
            // We will try to match, but if the previous content had nested divs, this will fail (match too early).
            // A safer fallback for this specific project (where we control the container) might be to look for the container 
            // and assume it ends at the *last* </div> if we can't parse it. 
            // But let's stick to the regex but warn if it looks suspicious.

            if (regex.test(htmlContent)) {
                // We'll just overwrite whatever we find in the "shallow" match. 
                // If the user has broken HTML, this might not help.
                // Ideally, we should ask the user to reset the file.
                // But let's try to inject the markers so next time it works.
                htmlContent = htmlContent.replace(regex, `$1\n${wrappedContent}\n$3`);
                console.log(`Updated ${htmlFilename} via regex injection (WARNING: might be fragile if nested divs existed).`);
            } else {
                console.error(`Could not find container <div id="${containerId}"> in ${htmlFilename}. Please ensure the file has the container or the placeholder ${placeholder}.`);
                return;
            }
        }

        // Update Last Updated Timestamp if placeholder exists
        const lastUpdatedPlaceholder = '<!-- LAST_UPDATED -->';
        if (htmlContent.includes(lastUpdatedPlaceholder)) {
            const now = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const dateStr = now.toLocaleDateString('fr-FR', options);
            // We replace the placeholder AND keep it for next time? 
            // Or we use a regex to replace the content inside the tag?
            // The user might want it to update every time. 
            // If we just replace the placeholder, it's gone.
            // Let's use a regex to replace the content of the h2 with id="last-updated" OR just replace the placeholder if we want to keep it simple but we need to keep the placeholder.
            // Actually, let's use a marker approach for this too, or just a regex on the specific ID.

            // Simpler: Just replace the content of the placeholder with "Mise à jour le ... <!-- LAST_UPDATED -->" so it persists?
            // Or better: Use a regex to find the h2 and replace its content.

            const timestampRegex = /(<h2 id="last-updated"[^>]*>)([\s\S]*?)(<\/h2>)/;
            if (timestampRegex.test(htmlContent)) {
                htmlContent = htmlContent.replace(timestampRegex, `$1Mise à jour le ${dateStr} <!-- LAST_UPDATED -->$3`);
            } else if (htmlContent.includes(lastUpdatedPlaceholder)) {
                // Fallback if regex fails but placeholder is there (e.g. first run)
                htmlContent = htmlContent.replace(lastUpdatedPlaceholder, `Mise à jour le ${dateStr} <!-- LAST_UPDATED -->`);
            }
        }

        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
        console.log(`Successfully built ${htmlFilename}`);

    } catch (err) {
        console.error(`Error building ${htmlFilename}:`, err);
    }
}

// Generate Articles
generatePage('articles.txt', 'articles.html', '<!-- ARTICLES_CONTENT -->', 'articles', (lines) => {
    if (lines.length < 3) return '';
    const title = lines[0].trim();
    const date = lines[lines.length - 1].trim();
    const contentLines = lines.slice(1, lines.length - 1);
    const content = contentLines.join('<br>').trim();

    return `
<article>
    <header>
        <h2>${title}</h2>
    </header>
    <section>
        <p>${content}</p>
    </section>
    <footer>
        <time>${date}</time>
    </footer>
</article>`;
});

// Generate Tour Dates
generatePage('tourdates.txt', 'tourdates.html', '<!-- TOURDATES_CONTENT -->', 'tourdates', (lines) => {
    if (lines.length < 5) return '';

    const dateStr = lines[0].trim();
    const band = lines[1].trim();
    const venue = lines[2].trim();
    const address = lines[3].trim();
    const status = lines[4].trim();

    const dateObj = parseDate(dateStr);
    const formattedDate = dateObj ? formatDateFrench(dateObj) : dateStr;
    const isPast = dateObj && dateObj < new Date();

    let cssClass = '';
    if (status.toLowerCase().includes('annulé')) {
        cssClass = 'cancelled';
    } else if (isPast) {
        cssClass = 'past-date';
    } else if (status.toLowerCase().includes('confirmé')) {
        cssClass = 'confirmed';
    } else {
        cssClass = 'pending';
    }

    return `<p class="${cssClass}">${formattedDate} - ${band} - ${venue} - ${address}</p>`;
});
