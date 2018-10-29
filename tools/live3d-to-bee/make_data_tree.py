#!/usr/bin/env python
from __future__ import print_function
import os, sys, time, glob, json
import ROOT
from ROOT import TFile
ROOT.gErrorIgnoreLevel = ROOT.kError

output_dir = "data" # don't change it!

def make_data_tree(rootfile):
    if (os.path.exists(output_dir)):
        os.system('rm -rf ' + output_dir)
    os.makedirs(output_dir)
    summary = {}
    summary_file = output_dir + '/summary.json'

    total_count = 0
    f = TFile(rootfile)
    t = f.Get("sps/spt")
    for x in t:
        new_dir = '%s/%i' % (output_dir, total_count)
        if (not os.path.exists(new_dir)):
            os.makedirs(new_dir)
        # print(new_dir)
        # print(x.run, x.subrun, x.event)
        jsonfile = '%s/%i/%i-3d.json' % (output_dir, total_count, total_count)
        cmd = "root -b -q -l loadClasses.C 'run_i.C(\"%s\", \"%s\", %i)'" % (
            rootfile, jsonfile, total_count)
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

        total_count += 1

    with open(summary_file, 'w') as outfile:
        json.dump(summary, outfile)


def usage():
    print("""
    python make_data_tree.py [input_root_file]

    """)

if __name__ == "__main__":
    # archive()
    if (len(sys.argv)!=2):
        usage()
    else:
        print(sys.argv)
        make_data_tree(sys.argv[1])