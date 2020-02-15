void run(const char* input="tmp/run005144_0038.root", const char* output="21-3d.json")
{
    gROOT->Reset();
    // gROOT->ProcessLine(".x loadClasses.C" );
    // gErrorIgnoreLevel=2001;
    gErrorIgnoreLevel = kError;

    LiveEvent ev(input, output);
    ev.WriteRandom();
}
