#!/usr/bin/env python
from __future__ import print_function
import os, sys, time, glob, json
import ROOT
from ROOT import TFile
ROOT.gErrorIgnoreLevel = ROOT.kError

run_list = [5834, 5826, 5313, 5284, 5387, 5341, 5432, 5786, 5770, 5146, 5145, 5213]
# 5313 175 1     20718
# 5284 140 1     46704
# 5341 160 1     55415
# 5146 160 7     19718
# 5213 130 7     38767

# 5145 180 7   221477
# 5387 180 1     47190
# 5432 180 2     45004
# 5770 180 6   108102
# 5786 180 3   139051
# 5826 180 0.5 104009
# 5834 180 0.3 138275



output_dir = "/data2/uploads/protodune-gallery/data"
input_dir = "/data2/users/protodune/root_files_sps_bee"
list_files = []


def make_gallery():
    global list_files
    list_files_tmp = glob.glob(input_dir+"/run*.root")
    list_files_tmp += glob.glob(input_dir+"_new/run*.root")
    for f in list_files_tmp:
        run = int(os.path.basename(f).split('_')[0][3:])
        if(run in run_list):
            list_files.append(f)
    list_files.sort(key=lambda x: os.path.basename(x))
    # list_files = list_files[:1]
    # print(list_files)
    make_files()

def make_files():
    if (not os.path.exists(output_dir)):
        os.makedirs(output_dir)
    summary = {}
    summary_file = output_dir + '/summary.json'

    total_count = 0
    for rootfile in list_files:
        f = TFile(rootfile)
        t = f.Get("sps/spt")
        this_count = -1
        for x in t:
            this_count += 1
            try:
                if (not x.trigger == 12): continue
            except AttributeError:
                print("no trigger in run", x.run)
                break

            new_dir = '%s/%i' % (output_dir, total_count)
            if (not os.path.exists(new_dir)):
                os.makedirs(new_dir)
            # print(new_dir)
            # print(x.run, x.subrun, x.event)
            jsonfile = '%s/%i/%i-3d.json' % (output_dir, total_count, total_count)
            cmd = "root -b -q -l loadClasses.C 'run_i.C(\"%s\", \"%s\", %i)'" % (
                rootfile, jsonfile, this_count)
            print(cmd)
            os.system(cmd)

            item = {
                "geom": "protodune",
                "content_list": ["3d"],
                "subRunNo": "1",
                "eventNo": "1",
                "runNo": "1",
                "trigger": "0",
                "data": {"3d": "/home/chao/uploads/protodune-gallery/data/0/0-3d.json"},
            }
            item["runNo"] = x.run
            item["subRunNo"] = x.subrun
            item["eventNo"] = x.event
            item["data"]["3d"] = jsonfile
            if (x.trigger):
                item["trigger"] = x.trigger
            summary[total_count] = item

            total_count += 1

        with open(summary_file, 'w') as outfile:
            json.dump(summary, outfile)



def usage():
    print("""
    python make_gallery.py

    """)

if __name__ == "__main__":
    # archive()
    if (len(sys.argv)>1):
        usage()
    else:
        make_gallery()