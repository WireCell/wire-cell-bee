void run(const char* input="tmp/recent.root", const char* output="0-3d.json")
{
    gROOT->Reset();
    // gROOT->ProcessLine(".x loadClasses.C" );
    // gErrorIgnoreLevel=2001;
    gErrorIgnoreLevel = kError;

    LiveEvent ev(input, output);
    ev.WriteRandom();
}