void run_i(const char* input, const char* output="0-3d.json", int i=0)
{
    gROOT->Reset();
    // gROOT->ProcessLine(".x loadClasses.C" );
    // gErrorIgnoreLevel=2001;
    gErrorIgnoreLevel = kError;

    LiveEvent ev(input, output);
    ev.Write(i);
}
