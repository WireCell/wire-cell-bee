
#!/usr/bin/python3
import sys, os, json, pprint, glob, shutil
pp = pprint.PrettyPrinter(width=41, compact=True)
all_files = []

def check(link):
    seg = link.split('/')
    if (seg[-1] != '/'):
        uuid = seg[-4]
        eventNo = seg[-2]
    else:
        print(link, 'does not trail by /')
        sys.exit(0)

    localDir = f'/data1/uploads/{uuid}/data/{eventNo}'
    if not os.path.exists(localDir):
        print(localDir, 'does not exist')
        sys.exit(0)
    
    print(localDir)
    global all_files
    all_files = glob.glob(f'{localDir}/*.json')

def add(summary, nextEvt):
    if not os.path.exists(f'data/{nextEvt}'):
        os.mkdir(f'data/{nextEvt}')

    info = {
        'content_list': [],
        'data': {},
        'eventNo': 0,
        'runNo': 0,
        'subRunNo': 0,
        'geom': 'uboone'
    }

    with open(all_files[0], "r") as f:
        runInfo = json.load(f)

    for path in all_files:
        filename = path.split('/')[-1]
        start = filename.index('-')+1
        end = filename.index('.')
        alg = filename[start:end]
        newname = f'{nextEvt}-{alg}.json'
        newpath = os.getcwd() + f'/data/{nextEvt}/{nextEvt}-{alg}.json'
        # print(newpath)
        shutil.copyfile(path, newpath) 

        info['content_list'].append(alg)
        info['data'][alg] = newpath
        info['eventNo'] = runInfo['eventNo']
        info['runNo'] = runInfo['runNo']
        info['subRunNo'] = runInfo['subRunNo']
        info['geom'] = runInfo['geom']

    summary[nextEvt] = info
    

if __name__ == "__main__":
'''
Add a bee event from a web link to a new collection. Place the script in parallel with the 'data' directory.
usage: python add.py [link to bee event]
'''
    with open("data/summary.json", "r") as f:
        summary = json.load(f)

    check(sys.argv[1])

    dirs = os.listdir('data')
    nextEvt = len(dirs)-1
    # print(nextEvt)
    add(summary, str(nextEvt))

    with open('data/summary.json', 'w') as outfile:
        json.dump(summary, outfile)

    pp.pprint(summary)
