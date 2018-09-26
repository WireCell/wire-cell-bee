#!/usr/bin/env python
from __future__ import print_function
import os, sys, time
import ROOT
from ROOT import TFile
ROOT.gErrorIgnoreLevel = ROOT.kError
cern_rootfile = '/eos/experiment/neutplatform/protodune/np04tier0/p3s/bee/recent.root'
input_rootfile = '/home/chao/sites/bee/tools/live3d-to-bee/tmp/recent.root'
output_jsonfile = '/data1/uploads/protodune-live/data/1/1-3d.json'

def archive():
    archive_dir = '/data2/users/protodune/root_files_sps_bee'
    recent_rootfile = archive_dir + '/recent.root'
    cmd = 'cp %s %s' % (input_rootfile, recent_rootfile)
    print('archiving ...')
    os.system(cmd)

    f = TFile(recent_rootfile)
    t = f.Get("sps/spt")
    count = 0
    try:
        for x in t:
            if (count>0): break
            count += 1
        new_filename = '%s/run%06i_%04i_%i.root' % (archive_dir, t.run, t.subrun, t.event)
        if (os.path.exists(new_filename)):
            print(new_filename, 'already exists')
        else:
            cmd = 'cp %s %s' % (recent_rootfile, new_filename)
            print(cmd)
            os.system(cmd)
    except:
        pass

def main():
    # cern_rootfile = '/eos/experiment/neutplatform/protodune/np04tier0/p3s/monitor/ac5275ae-af89-11e8-afff-fa163e328b1b/np04_mon_run003936_0001_dl2.root'

    rootIndex = output_jsonfile.find('protodune-live') - 1
    assert(rootIndex>0)
    rootDir = output_jsonfile[:rootIndex]
    assert(os.path.exists(rootDir))
    # print(rootDir)

    dirname, basename = os.path.split(output_jsonfile)
    # print(dirname, basename)
    if not os.path.exists(dirname):
        os.makedirs(dirname)

    cmd_1 = "/opt/xrootd/bin/xrdcp -f root://eospublic.cern.ch/%s %s" % (
        cern_rootfile, input_rootfile)
    cmd_2 = "root -b -q -l loadClasses.C 'run.C(\"%s\", \"%s\")'" % (
        input_rootfile, output_jsonfile)

    # print(cmd_1)
    # print(cmd_2)

    event_interval = 10 # sec
    transfer_ratio = 12 # 12*10 = 120 sec
    total_time = transfer_ratio * event_interval
    while (True):
        if (total_time / event_interval == transfer_ratio):
            os.system(cmd_1)
            total_time = 0
            archive()
        os.system(cmd_2)
        time.sleep(event_interval)
        total_time += event_interval


def usage():
    print("""
    python run.py

    """)

if __name__ == "__main__":
    # archive()
    if (len(sys.argv)>1):
        usage()
    else:
        main()