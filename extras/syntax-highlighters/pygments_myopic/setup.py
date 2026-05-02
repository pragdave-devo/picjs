# -*- coding: utf-8 -*-
# Copyright (c) 2021 Dave Thomas (pragdave)
# Licensed under the MIT License

u"""
Missing description
"""

from setuptools import setup

setup(
    name='pygments_myopic',
    version='0.2.0',
    description='PicJS Lexer for Pygments',
    author='pragdave',
    author_email='pragdave@gmail.com',
    license='MIT',
    keywords='syntax highlighting picjs',
    url='http://github.com/pragdave/pygments-myopic/',
    packages=['pygments_myopic'],
    install_requires=['Pygments >= 2.7.4'],
    include_package_data=False,
    platforms=['any'],
    entry_points={
        'pygments.lexers': [
            'PicjsLexer = pygments_myopic:PicjsLexer'
        ],
    },
    zip_safe=False
)
