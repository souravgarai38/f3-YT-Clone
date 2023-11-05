const baseURL = "https://www.googleapis.com/youtube/v3";
// const apiKey = "AIzaSyB0Jx1pX_H6HytRxjTEnKOGdRM1ylsdqB8"; //api 1
const apiKey = "AIzaSyCkspY3StTvvpiQ0kwA4kBUzRgLLAQQl9U"; //api 2



let descripsionMore = document.querySelector('.description-more');
let descripsionLess = document.querySelector('.description-less');
let commentBox = document.querySelector('.comment-box');


let urlParams = new URLSearchParams(window.location.search);
let videoId = urlParams.get('id');
let channelId = urlParams.get('ch_id');



let searchInput = document.querySelector('.search-input');
let searchButton = document.querySelector('.search-btn');
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



async function randerData(){
    let statistics = await getStatistic(videoId);
    let views = statistics[0];
    let likes = statistics[1];
    let comments = statistics[2];

    let snippet = await getSnippet(videoId);
    let publishedDate = snippet[0];
    let title = snippet[1];
    let description = snippet[2];
    let channelTitle = snippet[3];

    let channelStatistics = await getChannelStatistics(channelId);
    let subscribers = formatCount(channelStatistics[0]);
    let subscriberHidden = channelStatistics[1];

    let channelSnippet = await getChannelSnippet(channelId);
    let channelLogo = channelSnippet[0];

    let commentsList = await getCommentSnippet(videoId);
    // console.log(commentsList);

    document.querySelector('.stat-left').innerText = `${formatCount(views)} views . ${publishedDate}`;

    document.querySelector('.likes').innerText = `${formatCount(likes)}`;

    document.querySelector('.comments').innerText = `${formatCount(comments)} Comments`;

    document.querySelector('.player-title').innerText = title;

    document.querySelector('.description>p').innerText = description.split(' ').slice(0, 30).join(' ') + (description.split(' ').length > 30?'...':'');
    if(description.split(' ').length <= 30){
        descripsionMore.classList.add('d-none');
    }
    else{
        descripsionMore.addEventListener('click', () => {
            document.querySelector('.description>p').innerText = description;
            descripsionMore.classList.toggle('d-none');
            descripsionLess.classList.toggle('d-none');
        })
        descripsionLess.addEventListener('click', () => {
            document.querySelector('.description>p').innerText = description.split(' ').slice(0, 30).join(' ') + (description.split(' ').length > 30?'...':'');
            descripsionMore.classList.toggle('d-none');
            descripsionLess.classList.toggle('d-none');
        })
    }

    document.querySelector('.channel-left>img').src = channelLogo;
    document.querySelector('.channel-title').innerText = channelTitle;
    document.querySelector('.subscribers').innerText = subscriberHidden ? 'Subscribers Hidden' : subscribers+' Subscribers';

    await randerComments(commentsList);
}
async function randerComments(commentsList){
    commentBox.innerHTML = '';
    if(commentsList){
        commentsList.forEach(async (e) => {
            let comment = document.createElement('div');
            comment.className = 'comment-card';
            comment.innerHTML = `
                <img src="${e.snippet.topLevelComment.snippet.authorProfileImageUrl}" alt="">
                <div class="comment-content">
                    <div class="comment-writer-time">
                        <b class="writer-name">${e.snippet.topLevelComment.snippet.authorDisplayName}</b>
                        <p class="time">${formatPastDuration(e.snippet.topLevelComment.snippet.publishedAt)} ago</p>
                    </div>
                    <div class="comment-text">
                    ${e.snippet.topLevelComment.snippet.textOriginal}
                    </div>
                    <div class="comment-stat">
                        <p class="like-count">
                            <img src="./Icons/liked-videos-empty.png" alt="">
                            <span>${e.snippet.topLevelComment.snippet.likeCount}</span>
                        </p>
                        <p class="dislike-count">
                            <img src="./Icons/disliked-videos-empty.png" alt="">
                        </p>
                        <p class="reply">
                        ${e.snippet.totalReplyCount} REPLIES
                        </p>
                    </div>
                    <div class="reply-box d-none">
                    </div>
                </div>
            `;
    
            let reply = comment.querySelector('.reply');
            let replyBox = comment.querySelector('.reply-box');
            let replies = await getReplySnippet(e.id);
    
            reply.addEventListener('click', () => {
                if(replies.length) replyBox.classList.toggle('d-none');
            })
    
            await randerReply(replyBox, replies);
    
            commentBox.append(comment);
        })
    }
}
async function randerReply(replyBox, replies){
    if(replies.length){
        replies.forEach(e => {
            let comment = document.createElement('div');
            comment.className = 'comment-card';
            comment.innerHTML = `
                <div class="comment-card">
                    <img src="${e.snippet.authorProfileImageUrl}" alt="">
                    <div class="comment-content">
                        <div class="comment-writer-time">
                            <b class="writer-name">${e.snippet.authorDisplayName}</b>
                            <p class="time">${formatPastDuration(e.snippet.publishedAt)} ago</p>
                        </div>
                        <div class="comment-text">
                        ${e.snippet.textOriginal}
                        </div>
                        <div class="comment-stat">
                            <p class="like-count">
                                <img src="./Icons/liked-videos-empty.png" alt="">
                                <span>${e.snippet.likeCount}</span>
                            </p>
                            <p class="dislike-count">
                                <img src="./Icons/disliked-videos-empty.png" alt="">
                            </p>
                        </div>
                    </div>
                </div>
            `;
            replyBox.append(comment);
        })
    }
}

async function fetchVideos(searchQuery, maxResults) {
    const response = await fetch(
        `${baseURL}/search?key=${apiKey}&q=${searchQuery}&maxResults=${maxResults}&part=snippet`
    )
    const data = await response.json();

    let videos = data.items;

    await randerVideos(videos);
}
async function randerVideos(videos) {
    let videoContainer = document.querySelector('.video-list');
    videoContainer.innerHTML = '';

    for(let i = 0; i<videos.length; i++){
        let e = videos[i];
        let currentVideoId = e.id.videoId;
        if(videoId === currentVideoId) continue;

        let videoCard = await createVideoCard(e, currentVideoId);
        if(videoCard) videoContainer.append(videoCard);
    }
}
async function createVideoCard(e, videoId){
    try{
        let videoTitle = e.snippet.title;
        let publishTime = e.snippet.publishTime;
        let videoThumbnail = e.snippet.thumbnails.high.url;
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
                <img src="${videoThumbnail}" alt="">
                <p class="duration">${videoDuration}</p>
            </div>
            <div class="video-details">
                <p>${videoTitle.split('').slice(0, 30).join('')}${videoTitle.split('').length>30?'...':''}</p>
                <div class="video-name-views">
                    <p class="ch-name">${channelTitle}</p>
                    <p class="views">${formatCount(viewCount)} views . ${formatPastDuration(publishTime)} ago</p>
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
        
        return videoCard
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
                height: "100%",
                width: "100%",
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
function openVideoHtml(videoId, channelId){
    let link = document.createElement('a');
    link.href = `video.html?id=${videoId}&ch_id=${channelId}&q=${searchInput.value}`;
    link.click();
}



async function getStatistic(videoId){
    const response = await fetch(
        `${baseURL}/videos?key=${apiKey}&part=statistics&id=${videoId}`
    )
    const data = await response.json();

    let views =  data.items[0].statistics.viewCount;
    let likes = data.items[0].statistics.likeCount;
    let comments = data.items[0].statistics.commentCount;
    
    return [views, likes, comments];
}
async function getSnippet(videoId){
    const response = await fetch(
        `${baseURL}/videos?key=${apiKey}&part=snippet&id=${videoId}`
    )
    const data = await response.json();

    let publishedDate =  data.items[0].snippet.publishedAt;
    let title = data.items[0].snippet.title;
    let description = data.items[0].snippet.description;
    let channelTitle = data.items[0].snippet.channelTitle;
    
    return [dateString(new Date(publishedDate)), title, description, channelTitle];
}
async function getChannelStatistics(channelId){
    const response = await fetch(
        `${baseURL}/channels?key=${apiKey}&part=statistics&id=${channelId}`
    )
    const data = await response.json();

    let subscribers = data.items[0].statistics.subscriberCount;
    let subscriberHidden = data.items[0].statistics.hiddenSubscriberCount;

    return [subscribers, subscriberHidden];
}
async function getChannelSnippet(channelId){
    const response = await fetch(
        `${baseURL}/channels?key=${apiKey}&part=snippet&id=${channelId}`
    )
    const data = await response.json();

    let channelLogo = data.items[0].snippet.thumbnails.high.url;

    return [channelLogo];
}
async function getCommentSnippet(videoId){
    const response = await fetch(
        `${baseURL}/commentThreads?part=snippet&videoId=${videoId}&key=${apiKey}`
    )
    const data = await response.json();

    return data.items;
}
async function getReplySnippet(commentId){
    const response = await fetch(
        `${baseURL}/comments?part=snippet&parentId=${commentId}&key=${apiKey}&maxResults=20`
    )
    const data = await response.json();

    return data.items;
}
async function getVideoDuration(videoId) {
    const response = await fetch(
        `${baseURL}/videos?key=${apiKey}&part=contentDetails&id=${videoId}`
    )
    let data = await response.json();

    let duration = data.items[0].contentDetails.duration;
    // return new Promise((res, rej) => {
    //     res(parseISO8601Duration(duration));
    // });
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

    // return new Promise((res, rej) => {
    //     res(data.items[0].statistics.viewCount);
    // });

    return data.items[0].statistics.viewCount;
}



function formatCount(count){
    if(count>=10**9){
        return Math.floor(count/10**9) + 'B';
    }
    if(count>=10**6){
        return Math.floor(count/10**6) + 'M';
    }
    // if(viewCount>=10**5){
    //     return Math.floor(viewCount/10**5) + 'L';
    // }
    if(count>=10**3){
        return Math.floor(count/10**3) + 'K';
    }
    return count;
}
function dateString(date) {
    const months = [
        "Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sept", "Oct", "Nov", "Dec"
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
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
function parseISO8601Duration(duration) { //PT27S
    if(!duration) return "00:00";

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



try{
    playVideo();
}catch(error){
    window.location.reload();
}

randerData();

searchInput.value = urlParams.get('q')?urlParams.get('q'):'';
try {
    fetchVideos(searchInput.value, 30);
}
catch(error) {
    console.log(error);
}

function playVideo(){
    if(YT){
        new YT.Player('player',
            {
                height: "1000%",
                width: "100%",
                videoId: videoId,
                playerVars: {
                    'autoplay': 1,
                    'controls': 1,        
                    'modestbranding': 1,
                    'showinfo': 1,
                    'mute': 0
                }
            }
        )
    }
}
