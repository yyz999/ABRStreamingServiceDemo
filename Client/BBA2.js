

//y=k(x-a)+b

var lrvx; // also a
var urvx;
var k;
var b;
var bufLastS;
//bitRateOption
function ABRInitialize(options,chunkLength){
    lrvx=3*chunkLength;
    urvx=2*chunkLength*(options[options.length - 1]/options[0]);
    k=(options[options.length-1]-options[0])/(urvx-lrvx);
    b=options[0];
    c=options[options.length - 1];
    bufLastS=0;
}

function yfun(bo){
    if(bo<lrvx){
        return b;
    }    
    else if(bo>urvx){
        return c;
    }
    else{
        return k*(bo-lrvx)+b;
    }
}

function BBA2(lastS,bo,bw){
    lastS=lastS;
    bsbw=yfun(bo);
    templ=bitRateOption.length;
    if(lastS==0 && bsbw<bitRateOption[1]){
        return lastS;
    }
    if(lastS==(templ -1) && bsbw>bitRateOption[templ -2]){
        return lastS;
    }

    uS=Math.min(lastS+1,templ-1);
    lS=Math.max(0,lastS-1);
    if(bitRateOption[uS]<=bsbw){
        if(bw>bitRateOption[uS]){
            return Math.min(floorSelection(bw),floorSelection(bsbw));
        }
        else{
            return lastS;
        }
    }
    if(bitRateOption[lS]>=bsbw){
        return ceilingSelection(bsbw);
    }
    return lastS;

}

function floorSelection(bw){
    for(i=1;i<bitRateOption.length;i++){
        if(bitRateOption[i]>bw){
            return i-1;
        }
    }
    return bitRateOption.length -1;
}

function ceilingSelection(bw){
    for(i=0;i<bitRateOption.length;i++){
        if(bitRateOption[i]>=bw){
            return i;
        }
    }
    return bitRateOption.length -1;
}

function ABRBitrateSelect(bo,bw){
    bufLastS=(BBA2(bufLastS,bo*chunkLength,bw));
    return bufLastS+1;
}