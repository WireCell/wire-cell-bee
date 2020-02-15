#include "LiveEvent.h"

#include <iostream>
#include <vector>
#include <iomanip>

#include "TFile.h"
#include "TTree.h"
#include "TString.h"
#include "TTimeStamp.h"
#include "TRandom.h"

using namespace std;

LiveEvent::LiveEvent(){}

//----------------------------------------------------------------
LiveEvent::LiveEvent(const char* filename, const char* jsonFileName)
{
    rootFile = new TFile(filename);
    jsonFile.open(jsonFileName);
    T = 0;
    trigger = 0;
    vx = new vector<double>;
    vy = new vector<double>;
    vz = new vector<double>;
    vtrackid = new vector<int>;

    vcharge = new vector<double>;

    ReadEventTree();
}

void LiveEvent::ReadEventTree()
{
    T = (TTree*)rootFile->Get("sps/spt");
    // cout << T->GetEntries() << endl;

    T->SetBranchAddress("run", &run);
    T->SetBranchAddress("subrun", &subrun);
    T->SetBranchAddress("event", &event);
    T->SetBranchAddress("trigger", &trigger);
    T->SetBranchAddress("evttime", &evttime);
    T->SetBranchAddress("vx", &vx);
    T->SetBranchAddress("vy", &vy);
    T->SetBranchAddress("vz", &vz);
    T->SetBranchAddress("vcharge", &vcharge);
    T->SetBranchAddress("vtrackid", &vtrackid);

    // cout << run << " " << evttime << endl;

}

void LiveEvent::WriteRandom()
{
    gRandom->SetSeed(0);
    int i = gRandom->Uniform(0, T->GetEntries());
    Write(i);
}

void LiveEvent::Write(int i)
{

    T->GetEntry(i);
    cout << "writing event " << i << ": "
         << TString::Format("%i-%i-%i", run, subrun, event) << endl;

    int sec = int(evttime);
    int ns = int( (evttime-sec)*1e9 );
    TTimeStamp ts(sec, ns);
    // cout << evttime-3.52507e+08 << " " << sec << endl;
    // cout << ts.AsString() << endl;

    std::vector<double> vx_reco3d;
    std::vector<double> vy_reco3d;
    std::vector<double> vz_reco3d;
    std::vector<double> vcharge_reco3d;
    for (unsigned i=0; i<vx->size(); i++) {
        if (vtrackid->at(i)>=0) continue;
        vx_reco3d.push_back(vx->at(i));
        vy_reco3d.push_back(vy->at(i));
        vz_reco3d.push_back(vz->at(i));
        vcharge_reco3d.push_back(vcharge->at(i));
    }


    jsonFile << "{" << endl;

    jsonFile << fixed << setprecision(1);
    print_vector(jsonFile, vx_reco3d, "x");
    print_vector(jsonFile, vy_reco3d, "y");
    print_vector(jsonFile, vz_reco3d, "z");

    jsonFile << fixed << setprecision(0);
    print_vector(jsonFile, vcharge_reco3d, "q");

    jsonFile << '"' << "type" << '"' << ":" << '"' << "3d" << '"' << "," << endl;

    // always dump runinfo in the end
    // DumpRunInfo();

    jsonFile << '"' << "runNo" << '"' << ":" << '"' << run << '"' << "," << endl;
    jsonFile << '"' << "subRunNo" << '"' << ":" << '"' << subrun << '"' << "," << endl;
    jsonFile << '"' << "eventNo" << '"' << ":" << '"' << event << '"' << "," << endl;
    jsonFile << '"' << "trigger" << '"' << ":" << '"' << trigger << '"' << "," << endl;
    jsonFile << '"' << "eventTime" << '"' << ":" << '"' << ts.AsString() << '"' << "," << endl;
    jsonFile << '"' << "geom" << '"' << ":" << '"' << "protodune" << '"' << endl;



    jsonFile << "}" << endl;

}

//----------------------------------------------------------------
LiveEvent::~LiveEvent()
{
    jsonFile.close();
    rootFile->Close();
    delete rootFile;
}

//----------------------------------------------------------------
void LiveEvent::print_vector(ostream& out, vector<double>& v, TString desc, bool end)
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