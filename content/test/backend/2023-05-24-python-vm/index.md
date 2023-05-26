---
title: "How to setup a python virtual environment on windows 11"
date: 2023-05-24
categories: ["Frontend", "Python"]
tags:
- Python
- Virtual environment
description: "A virtual environment, or venv, is a Python module that creates a unique environment for each task or project. It installs the necessary packages specific to that setting while neatly organizing your projects.

Venv never modifies the system’s default Python versions or system modules. Using it allows a unique working environment to avoid disruptions to other Python variants existing but unrelated to your project."
thumbnail: "images/python.png"
slug: "/posts/2022-05-14-python-test/"
discussionId: "/posts/2023-05-24-python-virtual-environment/"
math: true
toc: true
draft: false
---

A virtual environment, or venv, is a Python module that creates a unique environment for each task or project. It installs the necessary packages specific to that setting while neatly organizing your projects.

Venv never modifies the system’s default Python versions or system modules. Using it allows a unique working environment to avoid disruptions to other Python variants existing but unrelated to your project.

## 1. Prerequisites

I recommend enabling the Windows Subsystem for Linux (WSL) to take full advantage of all the functionality of venv on Windows 10. This feature allows you to run a complete Linux distribution within Windows to aid in the functionality of the new dev environment.

### What is a Python Virtual Environment?

A Python virtual environment is a Python utility for managing dependencies and isolating projects. They enable Python third-party libraries (site packages) to be deployed locally in an isolated directory for a specific project rather than globally (system-wide).

A Python virtual environment is a directory containing three key elements:

- Symlinks to existing Python executables.
- Site-package directory for third-party libraries.
- Scripts that ensure Python code executes using the Python interpreter and libraries installed within the specified virtual environment.

**Why Should I Use WSL?**

Many of the tutorials for Python are written for Linux environments. In addition, a lot of developers use Linux-based packaging/installation tools. Using WSL ensures compatibility between development and production environments.

### What Are the Benefits of a Virtual Environment?

- You can better arrange your packages and know which packages you require to run your code if someone else wants to run it on their machine.
- You can use whichever version of Python you need for each environment without fear of conflicts.
- Your primary Python package directory is clear of unused Python packages, increasing performance.

#### How to Create a Python Virtual Environment

WSL will require you to download a version of Linux. If you’re using Windows (without WSL), simply install Python 3 from the Python website. The venv module is incorporated into that Windows installation

#### Create Your Python Virtual Environment

There are four basic steps to create a virtual environment on windows:

- Install Python
- Install Pip
- Install VirtualEnv
- Install VirtualEnvWrapper-win

## 1. Install Python 
There is a Python installer for Windows. This installer will download the required software during the installation.

There are also Python redistributable files that contain the Windows builds, which makes it easier to include Python in another software bundle. 

If you installed Ubuntu, Python3 comes pre-installed. Use the following command to verify this.

`which python3`

The output shows the directory path where Python3 is installed.

## 2. Install PIP
Python3 usually comes with pip preinstalled. However, some get the following error.

`pip command not found`

Should this occur, simply use the following method to install pip on Windows.

`curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py`

Download get-pip.py, and save the file. For this tutorial, the file is saved to the Desktop. 

Start a command prompt as an administrator, navigate to your Desktop, and run the get-pip.py script. After that, pip should work system-wide.

```
cd Desktop
python3 get-pip.py

```

Here is the same command using standard Python instead of Python 3.

```
cd Desktop
Python get-pip.py
```
## 3. Install Virtualenv
Type the following command into your Windows command shell prompt to install Virtualenv.

`pip install virtualenv`

### Start Virtualenv
To start Virtualenv, head to your project location on your windows command prompt. For this tutorial, the project name and location are my_project.

`cd my_project`

Once inside the project directory, run this command.

`virtualenv env`

### Activate Virtualenv

On Windows, venv creates a batch file called activate.bat located in the following directory.
`\venv\Scripts\activate.bat`

To activate the Python virtual environment on Windows, run the script from the directory. Username will be the user’s name logged into the environment.
`C:\Users\'Username'\venv\Scripts\activate.bat`

## 4. Install virtualenvwrapper-win 

There are two main recommended methods to install the virtualenvwrapper-win script.

### Install virtualenvwrapper-win With pip
You can install it using pip.

`pip install virtualenvwrapper-win`

### Install virtualenvwrapper-win From Source
Alternatively, you can install it from the source.

`git clone git://github.com/davidmarble/virtualenvwrapper-win.git`

Finally, change directories to the virtualenvwrapper-win directory and run the following.

`python setup.py install`

Your Python venv is set up and ready to use.

## Wrapping Up
Creating a Python virtual environment in Windows 10 gives developers another tool for isolating projects and getting things done. Using this simple method saves the hassle and cost of using multiple servers to separate projects.
