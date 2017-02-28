#!/usr/bin/env python
import os, sys, json, ROOT
from ROOT import TTree, TFile

def main(filename, eventNo):
    pe_thresh = 50
    info = {
        'op_t' : [],
        'op_peTotal' : [],
        'op_pes' : []
    }
    f = TFile(filename)
    t = f.Get("/Event/Sim")
    for entry in t:
        if eventNo != entry.eventNo:
            continue
        op_t = list(entry.of_t)
        op_peTotal = list(entry.of_peTotal)
        op_nFlash = entry.of_nFlash
        assert(op_nFlash == len(op_t))
        pe_opdet = entry.pe_opdet

        pes = []
        flash_id = 0
        for h in pe_opdet:
            pes.append([])
            nBins = h.GetNbinsX();
            for i in range(nBins):
                pes[flash_id].append(round(h.GetBinContent(i+1),2))
            flash_id += 1


    for i in range(op_nFlash):
        if (op_peTotal[i]<pe_thresh):
            continue
        info['op_t'].append(round(op_t[i], 2))
        info['op_peTotal'].append(round(op_peTotal[i], 2))
        info['op_pes'].append(pes[i])

    # print sum(info['op_pes'][0]), info['op_peTotal'][0]

    with open('op.json', 'w') as out:
        json.dump(info, out)
    print 'op info written to', os.getcwd()+'/op.json'
    # print info
    # print len(info['op_t'])

def usage():
    print """
    python dump_op.py [celltree_filename] [event_number]

    """

if __name__ == "__main__":
    if (len(sys.argv)<=1):
        usage()
    else:
        main(sys.argv[1], int(sys.argv[2]))