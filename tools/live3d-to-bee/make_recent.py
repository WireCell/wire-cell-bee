#!/usr/bin/env python
from __future__ import print_function
import os, sys, time, glob, json
import ROOT
from ROOT import TFile
ROOT.gErrorIgnoreLevel = ROOT.kError

N_RECENT = 200
output_dir = "/data1/uploads/protodune-recent/data"

def make_recent():
    archive_dir = '/data2/users/protodune/root_files_sps_bee'
    list_files = glob.glob(archive_dir+"/run*.root")
    list_files.sort(key=lambda x: os.path.getmtime(x))
    list_files = list_files[:-N_RECENT-1:-1] # last N reversed
    # print(list_files)
    if (not os.path.exists(output_dir)):
        os.makedirs(output_dir)
    summary = {}
    summary_file = output_dir + '/summary.json'

    total_count = 0
    for rootfile in list_files:
        f = TFile(rootfile)
        t = f.Get("sps/spt")
        this_count = 0
        for x in t:
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
                "data": {"3d": "/home/chao/uploads/protodune-live/data/0/0-3d.json"},
            }
            item["runNo"] = x.run
            item["subRunNo"] = x.subrun
            item["eventNo"] = x.event
            item["data"]["3d"] = jsonfile
            summary[total_count] = item

            this_count += 1
            total_count += 1

        with open(summary_file, 'w') as outfile:
            json.dump(summary, outfile)

def auto_make():
    from datetime import datetime
    make_interval = 60 * 60 * 2 # sec
    while (True):
        make_recent()
        print(datetime.now(), 'waiting for', make_interval/3600., 'hours ...')
        time.sleep(make_interval)



def usage():
    print("""
    python auto_make.py

    """)

if __name__ == "__main__":
    # archive()
    if (len(sys.argv)>1):
        usage()
    else:
        auto_make()