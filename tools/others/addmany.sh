#./addmany.sh uuid firstNo lastNo
for i in $(seq $2 $3); do echo python3 add.py https://www.phy.bnl.gov/twister/bee/set/$1/event/$i/; done

