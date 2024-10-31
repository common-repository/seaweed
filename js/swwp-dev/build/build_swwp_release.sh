#!/bin/bash

usage()
{
  echo
  echo "Usage: `basename $0` [OPTIONS] sourcedir outputfile"
  echo
  echo "Where: \"sourcedir\"        is the root directory of the javascript lib"
  echo "       \"outputfile\"       is the output file of the glued/compression lib"
  echo
  echo "OPTIONS:"
  echo "       \"-h\"               prints this message"
  echo "       \"-s\"               output without compression"
  echo "       \"-r\"               output without munging and with newlines after each statement, will remove debug/bootstrap namespaces"
  echo
}

failcheck()
{
if [ "$?" -ne 0 ]
then 
  echo
  echo
  echo "======Build failed!======";
  echo
  exit 1
fi 
}

NOCOMPRESS=
NOMUNGE=
while getopts 'h:sr' OPTION
do
     case $OPTION in
         h)
             usage
             exit
             ;;
         s)
             NOCOMPRESS=1
             ;;
         r)
         	 NOMUNGE=1
         	 ;;
         ?)
             usage
             exit
             ;;
     esac
done

shift $(($OPTIND - 1))

if [ $# -lt 2 ]
then
  usage
  exit $E_BADARGS
fi 

BASEPATH=`dirname $0`
DIRROOT=$1
OUT=$2
TEMPOUT="$BASEPATH/.swwpReleaseTMP"

echo -n "Glueing javascript library..."

cat $TEMPOUT > ".tmp"

echo "(function(){" > $TEMPOUT

cat "$DIRROOT/Core.js" >> $TEMPOUT

SOURCES=`ls $DIRROOT/*.js`
for i in $SOURCES
do
	FILENAME=`basename $i`
	if [ "$FILENAME" != "Core.js" ] && [ "$FILENAME" != "Bootstrapper.js" ] && [ "$FILENAME" != "SWWP.js" ]
	then
		cat "$i" >> $TEMPOUT
	fi
done

echo "})();" >> $TEMPOUT

failcheck
echo "OK!"

rm -f $OUT;

if [ "$NOCOMPRESS" ]
then
	echo
	echo "WARNING: NOT COMPRESSING LIBRARY"
	mv $TEMPOUT $OUT
else

	echo -n "Compressing javascript library..."
	
   if [ "$NOMUNGE" ]
   then
		echo
		echo "WARNING: NOT MUNGING LIBRARY IDENTIFIERS"   
   		java -jar "$BASEPATH/../tools/yuicompressor-2.4.2-ext.jar" --newlines --nomunge --type js -x "debug;swwpBootstrap" $TEMPOUT > $OUT
   else
   		java -jar "$BASEPATH/../tools/yuicompressor-2.4.2-ext.jar" --type js -x "debug;swwpBootstrap" $TEMPOUT > $OUT
   fi
	
	rm -f $TEMPOUT;
	failcheck
	echo "OK!"
	echo
	echo "NOTE: If getting errors in build version, then one subtle reason"
	echo "might be that one of the source files contains whitespace which "
	echo "it not regarded as whitespace by the compressor - in such cases "
	echo "they would be declared invalid global identifiers like Â;"
fi

echo
echo "======Build successful======"
echo
echo "Output to $OUT"
echo
