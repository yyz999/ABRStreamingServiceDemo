
document.addEventListener("DOMContentLoaded",function(){ initialiseVideoPlayer();},false);
var videoPlayer;
var option;
var ms;
var mimeCodec = 'video/webm; codecs="vorbis,vp8"';//'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
var chunkIndex;
var currentRate;
var xmlHttpRequest;
var chunkLength;
var chunkSize;
var videoDuration;
var bitRateOption=[];

var videoBuffer=[];
var videoBufferSize=25;
var videoBufferPP;
var videoBufferCP;
var stateRequest;
var stateAppend;
var currentStart;
var endFlag;

var timeStart;
var timeEnd;

var canvas;
var ctx;
var startingData;
var latestLabel;

var lastBW;

var watchDog;

var myLiveChart;

function intializeLineChart(){
    canvas = document.getElementById('updating-chart');
    ctx = canvas.getContext('2d');
    startingData = {
          labels: [0],
          datasets: [
              {
                  fillColor: "rgba(0,0,220,0.2)",
                  strokeColor: "rgba(0,0,220,1)",
                  pointColor: "rgba(0,0,220,1)",
                  pointStrokeColor: "#fff",
                  data: [0]
              },
              {
                  fillColor: "rgba(0,200,0,0.2)",
                  strokeColor: "rgba(0,200,0,1)",
                  pointColor: "rgba(0,200,0,1)",
                  pointStrokeColor: "#fff",
                  data: [0]
              }
          ]
        };
    latestLabel = 0;

    myLiveChart = new Chart(ctx).Line(startingData, {animationSteps: 15});
    
    for(i=-30;i<=0;i++){
        myLiveChart.addData([0, 0], i*4);
    }
    myLiveChart.removeData();
}

function initialiseVideoPlayer(){
    videoPlayer=document.getElementById('vp');
    option=document.getElementById('modeOption');
    chunkIndex=0;
    currentRate=1;
    videoBuffer=new Array(videoBufferSize+1);
    videoBufferCP=0;
    videoBufferPP=0;
    stateAppend=0;
    stateRequest=0;
    currentStart=0;

    lastBW=1000;

    intializeLineChart();

    ms=new MediaSource();
    
    videoPlayer.src=window.URL.createObjectURL(ms);
    ms.addEventListener('sourceopen',sourceOpen,false);
    videoPlayer.addEventListener('play',play,false);
    


}

function play(){
    if(watchDog==null){
        checkandRequest();
        watchDog = setInterval(freCheck, chunkLength*1000);
    }
    else{
        videoPlayer.play();
    }

}

function checkandRequest(){
    if(getAvailableLength()<videoBufferSize){
        if(chunkIndex<(chunkSize)){
            currentRate=option.selectedIndex;
            if(currentRate==5){
                currentRate=BWMeanSelect();
            }
            else if(currentRate==0){    
                //***ABR function: getAvailabeLength() return the occupancy in seconds; lastBW is the last downloading bandwidth   
                currentRate=ABRBitrateSelect(getAvailableLength(),getBW());
                // ABR end
            }        
            xmlHttpRequest.open("GET",'chunk,'+currentRate.toString()+','+chunkIndex.toString());
            timeStart=new Date().getTime()/1000;
            stateRequest=1;
            xmlHttpRequest.send();
        }
        else{
            endFlag=1;
        }
    }
    else{
        stateRequest=0;
    }    
}

function pause(){

}

function sourceOpen(){
    ms.addSourceBuffer(mimeCodec);
    ms.sourceBuffers[0].addEventListener('update',appendChunk,false);///////
    endFlag=0;
    xmlHttpRequest=new XMLHttpRequest();
    xmlHttpRequest.onreadystatechange=loadInfo;
    xmlHttpRequest.open("GET",'info.txt');
    xmlHttpRequest.send();   
}

function loadInfo(){
    if(xmlHttpRequest.readyState == 4 && xmlHttpRequest.status == 200){
        data=xmlHttpRequest.response;
        data.split('\n');
        //name
        title=document.getElementById('title');
        title.innerHTML = data.split('\n')[0].split('=')[1];
        //chunkLength
        chunkLength=parseInt(data.split('\n')[1].split('=')[1]);
        //chunkSize
        chunkSize=parseInt(data.split('\n')[2].split('=')[1]);
        //videoDuration
        videoDuration=parseInt(data.split('\n')[3].split('=')[1]);
        //bit rate options
        tmp=parseInt(data.split('\n')[4].split('=')[1]);
        bitRateOption=[];
        for(i=0;i<tmp;i++){
            bitRateOption.push(parseInt(data.split('\n')[5].split('=')[1].split(',')[i]));
        }
        document.getElementById('op1').innerHTML=bitRateOption[0].toString()+' kbps';
        document.getElementById('op2').innerHTML=bitRateOption[1].toString()+' kbps';
        document.getElementById('op3').innerHTML=bitRateOption[2].toString()+' kbps';
        document.getElementById('op4').innerHTML=bitRateOption[3].toString()+' kbps';
        //***Initialize ABR algorithm
        ABRInitialize(bitRateOption,chunkLength);
        //end
        xmlHttpRequest.abort();
        xmlHttpRequest.onreadystatechange=requestChunk;    
        xmlHttpRequest.responseType="arraybuffer";
    }
}


function appendChunk(){
    if((videoPlayer.currentTime-currentStart)>100){
        currentStart=videoPlayer.currentTime-50;
        ms.sourceBuffers[0].remove(0,currentStart);
    }
    else{
        if(getBufferedLength()>0){
            if(ms.duration>0){
                ms.sourceBuffers[0].timestampOffset=ms.duration;
            }
            ms.sourceBuffers[0].appendBuffer(videoBuffer[videoBufferCP]);
            if(videoPlayer.paused){
                videoPlayer.play();
            }
            videoBufferCP=videoBufferCP+1;
            if(videoBufferCP>videoBufferSize){
                videoBufferCP=0;
            }
            if(stateRequest==0&&endFlag==0){
                stateRequest=1;
                checkandRequest();
            } 
        }
        else{
            if(endFlag==1){
                ms.endOfStream();
            }
            stateAppend=0;
        }          
    }
      
}



function requestChunk(){
    if(xmlHttpRequest.readyState == 4 && xmlHttpRequest.status == 200){
        timeEnd=new Date().getTime()/1000;
        updateBW(bitRateOption[currentRate-1]*chunkLength/(timeEnd-timeStart));
        
        data=xmlHttpRequest.response;
        lastBW=data.byteLength/1024/(timeEnd-timeStart);
        drawBW(timeStart,lastBW,bitRateOption[currentRate-1]);
        chunkIndex=chunkIndex+1;
        xmlHttpRequest.abort();
        xmlHttpRequest.onreadystatechange=requestChunk;    
        xmlHttpRequest.responseType="arraybuffer";
        videoBuffer[videoBufferPP]=data;
        videoBufferPP=videoBufferPP+1;
        if(videoBufferPP>videoBufferSize){
            videoBufferPP=0;
        }
        if(stateAppend==0){
            stateAppend=1;
            appendChunk();
        }
        checkandRequest();
    }
}

function getBufferedLength() {
    return (videoBufferPP+videoBufferSize+1-videoBufferCP)%(videoBufferSize+1);

}

function getAvailableLength() {
    if(ms.duration>0){
        var tmp=(videoBufferPP+videoBufferSize+1-videoBufferCP)%(videoBufferSize+1)+(ms.duration-videoPlayer.currentTime)/chunkLength;
        return tmp;
    }
    else{
        return (videoBufferPP+videoBufferSize+1-videoBufferCP)%(videoBufferSize+1);
    }
}

function drawBW(time,bw,br){
    bw=bw*8;
    document.getElementById('speedTag').innerHTML = Math.floor(bw).toString();
    document.getElementById('bitrateTag').innerHTML = Math.floor(br).toString();
    document.getElementById('oc').innerHTML = Math.floor(getAvailableLength()/(videoBufferSize+1)*100).toString();
    latestLabel=latestLabel+4;
    if(isNaN(bw)){
        bw=0;
    }
    myLiveChart.addData([bw, br], latestLabel);
    myLiveChart.removeData();
}



function freCheck() {
    if(stateRequest==0&&stateAppend==0&&endFlag==0){
        if(getAvailableLength()<videoBufferSize){
            checkandRequest();
        }
    }
}



var bwBuffer=[];
var bwBufferLength=4;
function updateBW(bw){
    if(isNaN(bw)){
        return;
    }
    bwBuffer.push(bw);
    if(bwBuffer.length>bwBufferLength){
        bwBuffer.shift();
    }
}
function getBW(){
    var sum=0;
    for(i=0;i<bwBuffer.length;i++){
        sum=sum+bwBuffer[i];
    }
    if(bwBuffer.length>0){
        return sum/bwBuffer.length;
    }
    else{
        return 0;
    }
}

function BWMeanSelect(){
    var bw=getBW();
    var res=0;
    for(i=0;i<bitRateOption.length;i++){
        if(bitRateOption[i]>bw){
            break;
        }
        res=i;
    }
    return res+1;
}