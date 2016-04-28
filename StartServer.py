import SocketServer
 
HOST, PORT = '', 8888






def readVideo(rate,seg):
    filename='Video/VideoStream/vrate'+rate+'/'+'streamR'+rate+'S'+seg+'.webm'
    f=open(filename,'r')
    content=f.read()
    f.close()
    return content

class MyTCPHandler(SocketServer.BaseRequestHandler):  
    def handle(self):  
        # self.request is the TCP socket connected to the client  
        request = self.request.recv(1024)  
         
        method = request.split(' ')[0]  
        #print request
        if method == 'GET':  
            src = request.split(' ')[1]  
            if src == '/Client.css':  
                print 'send css'
                file_css = open('Client/Client.css','r')
                css_content=file_css.read()
                file_css.close()
                content = css_content
            elif src == '/Client.js':
                print 'send js'
                file_js=open('Client/Client.js','r')
                js_content=file_js.read()
                file_js.close()
                content = js_content
            elif src == '/info.txt':
                print 'send info'                
                file_videoInfo=open('Video/VideoStream/info.txt','r');
                video_info=file_videoInfo.read();
                file_videoInfo.close();
                content=video_info;
            elif src == '/favicon.ico':
                file_icon=open('favicon.ico','r');
                icon=file_icon.read();
                file_icon.close();
                content=icon;
            elif src == '/BBA2.js':
                print 'send ABR'
                file_ABR=open('Client/BBA2.js','r')
                ABR_content=file_ABR.read()
                file_ABR.close()
                content = ABR_content
            elif src =='/':
                print 'send html_content' 
                file_html = open('Client/Client.html', 'r')
                html_content=file_html.read()
                file_html.close()
                content = html_content
            else:
                tag1=src.split(',')[0]
                if(tag1=='/chunk'):
                    print 'send video ', src
                    content = readVideo(src.split(',')[1],src.split(',')[2])
                else:
                    print 'Unexpect request'
                    print request
                    content=''
            try:
                self.request.sendall(content)  
            except:
                print src
        else:
            print 'Unexpect request'
            print request

            

# Create the server  
server = SocketServer.TCPServer((HOST, PORT), MyTCPHandler)  
# Start the server, and work forever  
server.serve_forever()  