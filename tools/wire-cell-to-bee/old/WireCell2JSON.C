#include "TFile.h"
#include "TTree.h"
#include "TString.h"

#include <iostream>
#include <iomanip>
#include <fstream>
#include <vector>
#include <map>
#pragma link C++ class std::vector< std::vector<int> >+;

using namespace std;

void print_vector(ostream& out, vector<double>& v, TString desc, bool end=false);

void WireCell2JSON(TString filename, TString option = "truth", TString outfile="test.json")
{
    ofstream out(outfile.Data());

    TFile f(filename);
    TTree *t = 0;
    TTree *tr = 0;
    int runNo=0, subRunNo=0, eventNo=0, detector=0;
    double x=0, y=0, z=0, q=0, nq=1;
    vector<double> vx, vy, vz, vq, vnq;

    tr = (TTree*)f.Get("Trun");
    if (tr) {
        tr->SetBranchAddress("runNo", &runNo);
        tr->SetBranchAddress("subRunNo", &subRunNo);
        tr->SetBranchAddress("eventNo", &eventNo);
        tr->SetBranchAddress("detector", &detector);
        tr->GetEntry(0);
    }

    out << fixed << setprecision(1);
    out << "{" << endl;

    out << '"' << "runNo" << '"' << ":" << '"' << runNo << '"' << "," << endl;
    out << '"' << "subRunNo" << '"' << ":" << '"' << subRunNo << '"' << "," << endl;
    out << '"' << "eventNo" << '"' << ":" << '"' << eventNo << '"' << "," << endl;
    if (detector == 0) {
        out << '"' << "geom" << '"' << ":" << '"' << "uboone" << '"' << "," << endl;
    }
    else if (detector == 1) {
        out << '"' << "geom" << '"' << ":" << '"' << "dune35t" << '"' << "," << endl;
    }
    else if (detector == 2) {
        out << '"' << "geom" << '"' << ":" << '"' << "protodune" << '"' << "," << endl;
    }
    else if (detector == 3) {
        out << '"' << "geom" << '"' << ":" << '"' << "dune10kt_workspace" << '"' << "," << endl;
    }

    if (option == "truth") {
        t = (TTree*)f.Get("T_true");
    }
    else if (option == "rec_simple") {
        t = (TTree*)f.Get("T_rec");
    }
    else if (option == "rec_charge_blob") {
        t = (TTree*)f.Get("T_rec_charge");
    }
    else if (option == "rec_charge_cell") {
        t = (TTree*)f.Get("T_rec_charge_blob");
    }
    else if (option == "mc") {
        t = (TTree*)f.Get("TMC");
        if (t) {
            cout << "found MC" << endl;
            const int MAX_TRACKS = 30000;
            int mc_Ntrack;  // number of tracks in MC
            int mc_id[MAX_TRACKS];  // track id; size == mc_Ntrack
            int mc_pdg[MAX_TRACKS];  // track particle pdg; size == mc_Ntrack
            int mc_process[MAX_TRACKS];  // track generation process code; size == mc_Ntrack
            int mc_mother[MAX_TRACKS];  // mother id of this track; size == mc_Ntrack
            float mc_startXYZT[MAX_TRACKS][4];  // start position of this track; size == mc_Ntrack
            float mc_endXYZT[MAX_TRACKS][4];  // end position of this track; size == mc_Ntrack
            float mc_startMomentum[MAX_TRACKS][4];  // start momentum of this track; size == mc_Ntrack
            float mc_endMomentum[MAX_TRACKS][4];  // end momentum of this track; size == mc_Ntrack
            vector<vector<int> > *mc_daughters = new vector<vector<int> >;  // daughters id of this track; vector

            t->SetBranchAddress("mc_Ntrack"       , &mc_Ntrack);
            t->SetBranchAddress("mc_id"           , &mc_id);
            t->SetBranchAddress("mc_pdg"          , &mc_pdg);
            t->SetBranchAddress("mc_process"      , &mc_process);
            t->SetBranchAddress("mc_mother"       , &mc_mother);
            // t->SetBranchAddress("mc_daughters"    , &mc_daughters);
            t->SetBranchAddress("mc_startXYZT"    , &mc_startXYZT);
            t->SetBranchAddress("mc_endXYZT"      , &mc_endXYZT);
            t->SetBranchAddress("mc_startMomentum", &mc_startMomentum);
            t->SetBranchAddress("mc_endMomentum"  , &mc_endMomentum);
            int nEvents = t->GetEntries();
            cout << "nEvents:" << nEvents << endl;
            t->GetEntry(0);
        }
        out << '"' << "type" << '"' << ":" << '"' << option << '"' << endl;
        out << "}" << endl;
        return;
    }
    else {
        cout << "ERROR: Wrong option: " << option << endl;
        exit(0);
    }

    t->SetBranchAddress("x", &x);
    t->SetBranchAddress("y", &y);
    t->SetBranchAddress("z", &z);
    if (option != "rec_simple") {
        t->SetBranchAddress("q", &q);
    }
    if (option.Contains("charge")) {
        t->SetBranchAddress("nq", &nq);
    }
    int nEvents = t->GetEntries();
    for (int i=0; i<nEvents; i++) {
        t->GetEntry(i);
        vx.push_back(x);
        vy.push_back(y);
        vz.push_back(z);
        vq.push_back(q);
        vnq.push_back(nq);
    }



    print_vector(out, vx, "x");
    print_vector(out, vy, "y");
    print_vector(out, vz, "z");

    out << fixed << setprecision(0);
    print_vector(out, vq, "q");
    print_vector(out, vnq, "nq");


    out << '"' << "type" << '"' << ":" << '"' << option << '"' << endl;

    out << "}" << endl;


}

void print_vector(ostream& out, vector<double>& v, TString desc, bool end)
{
    int N = v.size();

    out << '"' << desc << '"' << ":[";
    for (int i=0; i<N; i++) {
        out << v[i];
        if (i!=N-1) {
            out << ",";
        }
    }
    out << "]";
    if (!end) out << ",";
    out << endl;
}
