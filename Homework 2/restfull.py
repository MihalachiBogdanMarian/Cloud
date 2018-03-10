import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from sys import argv

collections = ["movies", "movies2"]


class Server(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()

    def do_GET(self):
        # self._set_headers()
        self._set_headers()
        url = self.path
        if list(url).count("/") == 1:
            # get pe colectie
            if url.split("/")[1] not in collections:
                self.wfile.write("404 Collection Not Found \n\n".encode())
            else:
                collection = json.load(open(url.split("/")[1] + ".json", "rt"))
                self.wfile.write("200 OK \n\n".encode())
                for item in collection:
                    self.wfile.write(("Movie: " + item + "\n").encode())
                    self.wfile.write(("URI: /" + url.split("/")[1] + "/" + item + "\n").encode())
                    for itemInfo in collection[item]:
                        self.wfile.write(("\t" + itemInfo + ": " + collection[item][itemInfo] + "\n").encode())
        elif list(url).count("/") >= 2:
            # get pe item
            if url.split("/")[1] not in collections:
                self.wfile.write("404 Collection Not Found \n\n".encode())
            collection = json.load(open(url.split("/")[1] + ".json", "rt"))
            item = url.split("/")[2]
            if item in collection:
                self.wfile.write("200 OK \n\n".encode())
                self.wfile.write(("Movie: " + item + "\n").encode())
                for itemInfo in collection[item]:
                    self.wfile.write(("\t" + itemInfo + ": " + collection[item][itemInfo] + "\n").encode())
            else:
                self.wfile.write("404 Item Not Found \n\n".encode())

    def do_POST(self):
        # doesn't do anything with posted data
        self._set_headers()
        url = self.path
        if list(url).count("/") == 1:
            # post pe colectie
            if url.split("/")[1].split("?")[0] not in collections:
                self.wfile.write("404 Collection Not Found \n\n".encode())
            else:
                collection = json.load(open(url.split("/")[1].split("?")[0] + ".json", "rt"))
                id = 0
                if not collection:
                    id = 0
                else:
                    id = []
                    for item in collection:
                        for itemInfo in collection[item]:
                            if itemInfo == "id":
                                id.append(int(collection[item][itemInfo]))
                    id = max(id) + 1
                if "?" not in url:
                    self.wfile.write("403 Forbidden (You Must Specify Values For The Parameters) \n\n".encode())
                else:
                    right = url.split("?")[1]
                    rightSplit = right.split("&")
                    fields = []
                    for elem in rightSplit:
                        tuple = (elem.split("=")[0], elem.split("=")[1])
                        fields.append(tuple)
                    fields = dict(fields)
                    if "title" not in fields:
                        self.wfile.write(
                            "403 Forbidden (You Must Specify At Least A Title For The Movie) \n\n".encode())
                    else:
                        if fields["title"] in [elem["title"] for elem in collection.values()]:
                            self.wfile.write("409 Conflict (Resource Already Exists) \n\n".encode())
                        else:
                            rank = ""
                            main_character = ""
                            if "rank" in fields:
                                rank = fields["rank"]
                            if "main_character" in fields:
                                main_character = fields["main_character"]
                            collection["movie" + str(id)] = {"id": str(id), "title": fields["title"], "rank": rank,
                                                             "main_character": main_character}
                            s = json.dumps(collection)
                            open(url.split("/")[1].split("?")[0] + ".json", "wt").write(s)

                            self.wfile.write("201 CREATED \n\n".encode())
                            self.wfile.write(
                                ("Movie" + str(id) + " " + fields["title"] + " " + str(
                                    rank) + " " + main_character).encode())
        elif list(url).count("/") >= 2:
            # post pe item
            self.wfile.write("405 Method Not Allowed (Post On Item) \n\n".encode())

    def do_PUT(self):
        self._set_headers()
        url = self.path
        if list(url).count("/") == 1:
            # put pe colectie
            if url.split("/")[1].split("?")[0] not in collections:
                self.wfile.write("404 Collection To Be Replaced Not Found \n\n".encode())
            elif "?" not in url:
                self.wfile.write("403 Forbidden (You Must Specify The New Collection) \n\n".encode())
            elif url.split("/")[1].split("?")[1] not in collections:
                self.wfile.write("404 New Collection Not Found \n\n".encode())
            elif url.split("/")[1].split("?")[0] == url.split("/")[1].split("?")[1]:
                self.wfile.write("403 Forbidden (Can't Replace A Collection With The Same Collection) \n\n".encode())
            else:
                collection2 = json.load(open(url.split("/")[1].split("?")[1] + ".json", "rt"))
                self.wfile.write("200 OK \n\n".encode())
                s = json.dumps(collection2)
                open(url.split("/")[1].split("?")[0] + ".json", "wt").write(s)

        elif list(url).count("/") == 2:
            # put pe item
            if url.split("/")[1] not in collections:
                self.wfile.write("404 Collection Not Found \n\n".encode())
            elif "?" not in url:
                self.wfile.write("403 Forbidden (You Must Specify At Least An Attribute For The Movie) \n\n".encode())
            else:
                collection = json.load(open(url.split("/")[1] + ".json", "rt"))
                item = url.split("/")[2].split("?")[0]
                id = 0
                if not collection:
                    id = 0
                else:
                    id = []
                    for elem in collection:
                        for itemInfo in collection[elem]:
                            if itemInfo == "id":
                                id.append(int(collection[elem][itemInfo]))
                    id = max(id) + 1

                right = url.split("/")[2].split("?")[1]
                rightSplit = right.split("&")
                fields = []
                for elem in rightSplit:
                    tuple = (elem.split("=")[0], elem.split("=")[1])
                    fields.append(tuple)
                fields = dict(fields)
                if item not in collection.keys():
                    rank = ""
                    main_character = ""
                    if "rank" in fields:
                        rank = fields["rank"]
                    if "main_character" in fields:
                        main_character = fields["main_character"]
                    collection["movie" + str(id)] = {"id": str(id), "title": fields["title"], "rank": rank,
                                                     "main_character": main_character}
                    s = json.dumps(collection)
                    open(url.split("/")[1].split("?")[0] + ".json", "wt").write(s)

                    self.wfile.write("201 CREATED \n\n".encode())
                    self.wfile.write(
                        ("Movie" + str(id) + " " + fields["title"] + " " + str(rank) + " " + main_character).encode())
                else:
                    for elem in fields:
                        if elem in ["title", "rank", "main_character"]:
                            collection[item][elem] = fields[elem]
                    s = json.dumps(collection)
                    open(url.split("/")[1].split("?")[0] + ".json", "wt").write(s)

                    self.wfile.write("201 UPDATED \n\n".encode())

    def do_DELETE(self):
        self._set_headers()
        url = self.path
        if list(url).count("/") == 1:
            # delete pe colectie
            if url.split("/")[1] not in collections:
                self.wfile.write("404 Collection Not Found \n\n".encode())
            else:
                collection = {}
                s = json.dumps(collection)
                open(url.split("/")[1] + ".json", "wt").write(s)
                self.wfile.write("201 DELETED \n\n".encode())
        elif list(url).count("/") == 2:
            # delete pe item
            if url.split("/")[1] not in collections:
                self.wfile.write("404 Collection Not Found \n\n".encode())
            collection = json.load(open(url.split("/")[1] + ".json", "rt"))
            item = url.split("/")[2]
            if item in collection:
                del collection[item]
                s = json.dumps(collection)
                open(url.split("/")[1] + ".json", "wt").write(s)
                self.wfile.write("201 DELETED \n\n".encode())
            else:
                self.wfile.write("404 Item Not Found \n\n".encode())


def run(server_class=HTTPServer, handler_class=Server, port=9000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print('Starting server...')
    httpd.serve_forever()


if __name__ == "__main__":
    if len(argv) == 2:
        run(port=int(argv[1]))
    else:
        run()
