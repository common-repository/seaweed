#!/bin/bash

usage()
{
  echo
  echo "Usage: `basename $0` projectdir outputdir"
  echo
  echo "Where: \"projectdir\"       is the root directory of the seaweed SVN trunk/branch"
  echo "       \"outputdir\"        is the output directory of the wordpress plugin - a directory called \"seaweed\" will be created"
  echo
  echo "OPTIONS:"
  echo "       \"-h\"               prints this message"
  echo "       \"-d\"               development release - full open source / debug versions will be released"
  echo "       \"-s\"               skip building javascripts when packaging"
  echo "                            (warning: only skip if you know that the current scripts are up to date)"
  echo
}

failcheck()
{
if [ "$?" -ne 0 ]
then 
  echo
  echo
  echo "======Packaging failed!======";
  echo
  exit 1
fi 
}

DEVON=
SKIPJSBUILDS=
while getopts 'h:ds' OPTION
do
     case $OPTION in
         h)
             usage
             exit
             ;;
         d)
             DEVON=1
             ;;
         s)
             SKIPJSBUILDS=1
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
PROJECTDIR=$1
OUTDIR=$2
MSGPREFIX="`basename $0` >> "

echo "[ ~Seaweed~ package manager ]"
echo
echo -n "OUTPUT-MODE:   "
if [ "$DEVON" ]
then
	echo "DEV"
else
	echo "RELEASE"
fi
echo "PROJECTDIR:   $PROJECTDIR"
echo "OUTDIR:       $OUTDIR"
echo
echo

echo
echo -n "$MSGPREFIX Ensuring out directory exists..."
if [ -d $OUTDIR ]
then
	echo "OK!"
else
    echo
    echo "$MSGPREFIX ERROR: $OUTDIR does not exist" >&2
    exit 1
fi

if [ -d "$OUTDIR/seaweed" ]
then
    echo
    echo "$MSGPREFIX ERROR: $OUTDIR/seaweed already exsits - manually remove this if you want to create a new release" >&2
    exit 1
fi


if [ "$SKIPJSBUILDS" ]
then

    echo
    echo "$MSGPREFIX WARNING: Skipping build of javascripts"

else

    if [ "$DEVON" ]
    then
	echo
	echo -n "$MSGPREFIX Building debug for DEdit lib..."
	make debug
	failcheck
	
	echo
	echo -n "$MSGPREFIX Building debug for SWWP lib..."
	make swwpdebug
	failcheck
    else
	echo
	echo -n "$MSGPREFIX Building release for DEdit lib..."
	make release
	failcheck
	
	echo
	echo -n "$MSGPREFIX Building release for SWWP lib..."
	make swwprelease
	failcheck
    fi

fi

PLUGINDIR="$PROJECTDIR/integration/wpress/plugin/seaweed"

if [ -d $PLUGINDIR ]
then

	echo
	echo -n "$MSGPREFIX Copying seaweed plugin to target directory..."
	rsync -rv --exclude=".svn" $PLUGINDIR $OUTDIR
	failcheck
	echo "OK!"
	
	SWLIBDIR="$PROJECTDIR/src"
	
	if [ -d $SWLIBDIR ]
	then
	
		DEDITDIR="$OUTDIR/seaweed/js/dedit"
		echo
		echo -n "$MSGPREFIX Ensuring dedit directory exists..."
		if [ -d $DEDITDIR ]
		then
			echo "OK!"
		else
			mkdir $DEDITDIR
			failcheck
			echo "created"
		fi

		if [ "$DEVON" ]
		then
		
			echo
			echo -n "$MSGPREFIX Copying full DEdit source to wordpress plugin js dir..."
			rsync -rv --exclude=".svn" $SWLIBDIR/ $DEDITDIR
			failcheck
			echo "OK!"
			
		else
			
			echo
			echo -n "$MSGPREFIX Copying release DEdit release source to wordpress plugin js dir..."
			cp "$SWLIBDIR/DEdit.js" "$DEDITDIR/."
			failcheck
			echo "OK!"
			
			echo
			echo -n "$MSGPREFIX Removing dev source for wordpress plugin.."
			rm -f "/tmp/sw_plug_gui.js"
			mv "$OUTDIR/seaweed/js/swwp/SWWP.js" "/tmp/sw_plug_gui.js"
			rm $OUTDIR/seaweed/js/swwp/*.js
			mv /tmp/sw_plug_gui.js "$OUTDIR/seaweed/js/swwp/SWWP.js"
			failcheck
			echo "OK!"
			
		fi
	
	else

	    echo
	    echo "$MSGPREFIX ERROR: Missing seaweed lib src path: $SWLIBDIR" >&2
	    exit 1
	fi

else
	echo
    echo "$MSGPREFIX ERROR: Missing seaweed wordpress plugin path: $PLUGINDIR" >&2
    exit 1
fi

echo
echo
echo "======Packaging successful======"
echo
echo "Output to $OUTDIR"
echo
