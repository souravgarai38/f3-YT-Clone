const baseURL = "https://www.googleapis.com/youtube/v3";
// const apiKey = "AIzaSyB0Jx1pX_H6HytRxjTEnKOGdRM1ylsdqB8"; //api 1
const apiKey = "AIzaSyCkspY3StTvvpiQ0kwA4kBUzRgLLAQQl9U"; //api 2


// var currentThumbnailImg = null;

async function fetchVideos(searchQuery, maxResults) {
    try{
        const response = await fetch(
            `${baseURL}/search?key=${apiKey}&q=${searchQuery}&maxResults=${maxResults}&part=snippet`
        )
        const data = await response.json();
    
        let videos = data.items;
        // console.log(videos);
    
        await randerVideos(videos);
    }catch(error){
        console.log(error);
    }
}

async function getVideoDuration(videoId) {
    const response = await fetch(
        `${baseURL}/videos?key=${apiKey}&part=contentDetails&id=${videoId}`
    )
    let data = await response.json();
    let duration = data.items[0].contentDetails.duration;
    
    return parseISO8601Duration(duration);
}

async function getChannelData(channelId){
    const response = await fetch(
        `${baseURL}/channels?key=${apiKey}&part=snippet&id=${channelId}`
    )
    const data = await response.json();

    // return new Promise((res, rej) => {
    //     res([data.items[0].snippet.title, data.items[0].snippet.thumbnails.high.url]);
    // })

    return [data.items[0].snippet.title, data.items[0].snippet.thumbnails.high.url];
}

async function getViewCount(videoId){
    const response = await fetch(
        `${baseURL}/videos?key=${apiKey}&part=statistics&id=${videoId}`
    )
    const data = await response.json();

    return data.items[0].statistics.viewCount;
}

function parseISO8601Duration(duration) { //PT27S
    if(!duration) return "NO DATA";

    const isoDurationRegex = /^P(?:T(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?)?$/;
    const matches = duration.match(isoDurationRegex);

    if (!matches) return "LIVE";

    const hours = parseFloat(matches[1] || 0);
    const minutes = parseFloat(matches[2] || 0);
    const seconds = parseFloat(matches[3] || 0);

    let result = "";
    if (hours > 0) {
        result += hours + ":";
    }
    // else result += "0:";
    if (minutes > 0) {
        result += (minutes<10 ? "0" : "") + minutes + ":";
    }
    else result += "00:";
    if (seconds > 0) {
        result += (seconds<10 ? "0" : "") + seconds;
    }
    else result += "00";

    return result.trim();
}

function formatPastDuration(publishTime){
    let d1 = new Date(publishTime)
    let d2 = new Date();
    let totalTime = Math.floor((d2-d1)/(1000*60));

    if(totalTime>=365*24*60){
        return Math.floor(totalTime/(365*24*60)) + ' year' + (Math.floor(totalTime/(365*24*60))>1 ? 's' : '');
    }
    if(totalTime>=30*24*60){
        return Math.floor(totalTime/(30*24*60)) + ' month' + (Math.floor(totalTime/(30*24*60))>1 ? 's' : '');
    }
    if(totalTime>=7*24*60){
        return Math.floor(totalTime/(7*24*60)) + ' week' + (Math.floor(totalTime/(7*24*60))>1 ? 's' : '');
    }
    if(totalTime>=24*60){
        return Math.floor(totalTime/(24*60)) + ' day' + (Math.floor(totalTime/(24*60))>1 ? 's' : '');
    }
    if(totalTime>=60){
        return Math.floor(totalTime/(60)) + ' hour' + (Math.floor(totalTime/(60))>1 ? 's' : '');
    }
    return totalTime + ' min' + (totalTime>1 ? 's' : '');
}

async function randerVideos(videos) {
    let videoContainer = document.querySelector('.right-grid');
    videoContainer.innerHTML = '';

    for(let i = 0; i<videos.length; i++){
        let e = videos[i];
        let videoId = e.id.videoId;

        let videoCard = await createVideoCard(e, videoId);

        if(videoCard) videoContainer.append(videoCard);
    }
}

async function createVideoCard(e, videoId){
    try{
        let videoTitle = e.snippet.title;
        let publishTime = e.snippet.publishTime;
        let videoThumbnail = e.snippet.thumbnails.high.url;
        videoThumbnail.onerror = () => {
            videoThumbnail = '';
        }
        let videoDuration = await getVideoDuration(videoId);
        let viewCount = await getViewCount(videoId);
        let channelData = await getChannelData(e.snippet.channelId);
        let channelId = e.snippet.channelId;
        let channelTitle = channelData[0];
        let channelLogo = channelData[1];
    
        let videoCard = document.createElement('div');
        videoCard.className = 'video-card'
        videoCard.innerHTML = `
            <div class="thumbnail" id="thumbnail-${videoId}">
                <img src="${videoThumbnail}" alt=""/>
                <p class="duration">${videoDuration}</p>
            </div>
            <div class="video-details">
                <img src="${channelLogo}" alt="">
                <div class="video-name-views">
                    <p class="name">${videoTitle.split('').slice(0, 25).join('')}${videoTitle.split('').length>25?'...':''}</p>
                    <p class="ch-name">
                        ${channelTitle}
                        <br>
                        ${formatViewCount(viewCount)} Views . ${formatPastDuration(publishTime)} ago
                    </p>
                </div>
            </div>
        `;
    
        let durationBox = videoCard.querySelector('.duration');
        if(durationBox.innerText === 'LIVE') {
            durationBox.style.backgroundColor = 'red';
            durationBox.style.fontWeight = 'bold';
        }
    
        videoCard.addEventListener('click', () => {
            openVideoHtml(videoId, channelId);
        })
    
        videoCard.addEventListener('mouseenter', e => playVideoPreview(videoCard, videoId, channelId));
        videoCard.addEventListener('mouseleave', e => stopVideoAndDisplayThumbnail(videoCard));
        return videoCard;
    }catch(error){
        // console.log(`This videoId is ${videoId}!!`);
    }
}
function playVideoPreview(videoCard, videoId, channelId) {
    videoCard.querySelector('.thumbnail>img').classList.add('d-none');
    let previewPlayer = document.createElement('div');
    previewPlayer.id = 'preview-player';
    videoCard.querySelector('.thumbnail').append(previewPlayer);
    if (YT) {
        new YT.Player('preview-player',
            {
                videoId: videoId,
                playerVars: {
                    'autoplay': 1,
                    'controls': 0,        
                    'modestbranding': 1,
                    'showinfo': 0,
                    'mute': 1
                }
            }
        )
    }
    previewPlayer.addEventListener('click', event=> {
        event.preventDefault();
        stopVideoAndDisplayThumbnail(videoCard);
        openVideoHtml(videoId, channelId);
    });
}
function stopVideoAndDisplayThumbnail(videoCard){
    videoCard.querySelector('.thumbnail>#preview-player').remove();
    videoCard.querySelector('.thumbnail>img').classList.remove('d-none');
}

function formatViewCount(viewCount){
    if(viewCount === undefined) return 'No';

    if(viewCount>=10**9){
        return Math.floor(viewCount/10**9) + 'B';
    }
    if(viewCount>=10**6){
        return Math.floor(viewCount/10**6) + 'M';
    }
    // if(viewCount>=10**5){
    //     return Math.floor(viewCount/10**5) + 'L';
    // }
    if(viewCount>=10**3){
        return Math.floor(viewCount/10**3) + 'K';
    }
    return viewCount;
}

function openVideoHtml(videoId, channelId){
    let link = document.createElement('a');
    link.href = `video.html?id=${videoId}&ch_id=${channelId}&q=${searchInput.value}`;
    link.click();
}


// call fechvideo
let searchInput = document.querySelector('.search-input');
let searchButton = document.querySelector('.search-btn');

let urlParams = new URLSearchParams(window.location.search);
searchInput.value = urlParams.get('q')?urlParams.get('q'):'';




fetchVideos(searchInput.value, 30);



searchButton.addEventListener('click', () => {
    let link = document.createElement('a');
    link.href = `index.html?q=${searchInput.value}`;
    link.click();
})
searchInput.addEventListener('keydown', (event) =>{
    if(event.keyCode === 13){
        let link = document.createElement('a');
        link.href = `index.html?q=${searchInput.value}`;
        link.click();
    }
})
