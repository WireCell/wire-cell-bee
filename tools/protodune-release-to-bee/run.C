void run(const char* input="tmp/np04_raw_run004646_0058_dl2_fullreco_event4_eventtree.root", const char* output="2-3d.json")
{
    gROOT->Reset();
    // gROOT->ProcessLine(".x loadClasses.C" );
    // gErrorIgnoreLevel=2001;
    LiveEvent ev(input, output);
    ev.WriteRandom();
}