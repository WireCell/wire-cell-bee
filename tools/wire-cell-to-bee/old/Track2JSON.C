#include "TFile.h"
#include "TTree.h"
#include "TString.h"

#include <iostream>
#include <iomanip>
#include <fstream>

using namespace std;

const int MAXPOINTS = 10000;
double x[MAXPOINTS], y[MAXPOINTS], z[MAXPOINTS];
double theta[MAXPOINTS], phi[MAXPOINTS];
double energy[MAXPOINTS], dedx[MAXPOINTS];
int npoints;
int trackid;

vector<double> v_x, v_y, v_z;
vector<double> v_theta, v_phi;
vector<double> v_energy, v_dedx;

void print_vector(ostream& out, vector<double>& v, TString desc, bool end=false);

void Track2JSON(TString filename, TString outfile)
{
    ofstream out(outfile.Data());

    TFile f(filename);
    TTree *t_goodtrack, *t_badtrack, *t_shorttrack, *t_paratrack;
    const int NTYPE = 4;
    TTree *t[NTYPE];
    TString t_name[NTYPE] = {
        "T_goodtrack",
        "T_badtrack",
        "T_shorttrack",
        "T_paratrack"
    };

    for (int i=0; i<NTYPE; i++) {
        t[i] = (TTree*)f.Get(t_name[i].Data());
        SetBranchAddress(t[i]);
    }

    out << fixed << setprecision(1);
    out << "{" << endl;
    out << '"' << "tracks" << '"' << ":" << '[' << endl;

    for (int typeId=0; typeId<NTYPE; typeId++) {
        int nTracks = t[typeId]->GetEntries();
        for (int i=0; i<nTracks; i++) {
            t[typeId]->GetEntry(i);

            out << "{" << endl;
            for (int j=0; j<npoints; j++) {
                v_x.push_back(x[j]);
                v_y.push_back(y[j]);
                v_z.push_back(z[j]);
                v_theta.push_back(theta[j]);
                v_phi.push_back(phi[j]);
                v_energy.push_back(energy[j]);
                v_dedx.push_back(dedx[j]);
            }
            print_vector(out, v_x, "x");
            print_vector(out, v_y, "y");
            print_vector(out, v_z, "z");
            print_vector(out, v_theta, "theta");
            print_vector(out, v_phi, "phi");
            print_vector(out, v_energy, "energy");
            print_vector(out, v_dedx, "dedx");

            out << '"' << "type" << '"' << ":" << typeId << "," << endl;
            out << '"' << "trackid" << '"' << ":" << trackid << endl;
            out << "}";
            if (! (i==nTracks-1 && typeId==NTYPE-1) ) out << "," << endl;
            else out << endl;

            {  // reset
                v_x.clear();
                v_y.clear();
                v_z.clear();
                v_theta.clear();
                v_phi.clear();
                v_energy.clear();
                v_dedx.clear();
                for (int k=0; k<MAXPOINTS; k++) {
                    x[k] = 0;
                    y[k] = 0;
                    z[k] = 0;
                    theta[k] = 0;
                    phi[k] = 0;
                    energy[k] = 0;
                    dedx[k] = 0;
                }
            }
        }
    }


    out << ']' << endl;
    out << '}' << endl;

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

void SetBranchAddress(TTree *t)
{
    t->SetBranchAddress("npoints", &npoints);
    t->SetBranchAddress("trackid", &trackid);
    t->SetBranchAddress("x", &x);
    t->SetBranchAddress("y", &y);
    t->SetBranchAddress("z", &z);
    t->SetBranchAddress("theta", &theta);
    t->SetBranchAddress("phi", &phi);
    t->SetBranchAddress("energy", &energy);
    t->SetBranchAddress("dedx", &dedx);
}