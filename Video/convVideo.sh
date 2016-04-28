SegSec=4
filename='VideoSample2.mp4'
DUR=$(ffprobe $filename 2>&1 | sed -n "s/.* Duration: \([^,]*\), .*/\1/p")
HRS=$(echo $DUR | cut -d":" -f1)
MIN=$(echo $DUR | cut -d":" -f2)
SEC=$(echo $DUR | cut -d":" -f3)
TOT_SEC=$(echo "($HRS*3600+$MIN*60+$SEC)" | bc | cut -d"." -f1)
echo $TOT_SEC
mkdir VideoStream
cd VideoStream
mkdir vrate1
mkdir vrate2
mkdir vrate3
mkdir vrate4
cd ..

for ((i=3 ; i < 1980 ; i=`expr $i + $SegSec`))
	do
		id=`expr $i / $SegSec`
		ffmpeg -ss $i -i $filename -t $SegSec -minrate 1000k -maxrate 1128k -b:v 1000k -c:v libvpx  -c:a libvorbis VideoStream/vrate1/streamR1S${id}.webm 
		ffmpeg -ss $i -i $filename -t $SegSec -minrate 2000k -maxrate 2128k -b:v 2000k -c:v libvpx  -c:a libvorbis VideoStream/vrate2/streamR2S${id}.webm 
		ffmpeg -ss $i -i $filename -t $SegSec -minrate 4000k -maxrate 4128k -b:v 4000k -c:v libvpx  -c:a libvorbis VideoStream/vrate3/streamR3S${id}.webm 
		ffmpeg -ss $i -i $filename -t $SegSec -minrate 8000k -maxrate 8128k -b:v 8000k -c:v libvpx  -c:a libvorbis VideoStream/vrate4/streamR4S${id}.webm 
		echo $i
		echo $TOT_SEC
	done
