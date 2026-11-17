"""Polyglot Bible Reader - Adapters Package."""
from .base import BaseAdapter, VerseUnit, WordToken
from .vulgate import VulgateAdapter
from .wlc import WLCAdapter
from .swete_lxx import SweteLXXAdapter
from .ognt import OGNTAdapter
from .kjv import KJVAdapter
from .webbe import WEBBEAdapter
from .brenton import BrentonAdapter
from .peshitta import PeshittaAdapter
from .sblgnt import SBLGNTAdapter
from .luther1912 import Luther1912Adapter
from .douay import DouayAdapter
from .vamvas import VamvasAdapter
from .bdb import BDBAdapter
from .lsj import LSJAdapter

__all__ = [
    "BaseAdapter",
    "VerseUnit",
    "WordToken",
    "VulgateAdapter",
    "WLCAdapter",
    "SweteLXXAdapter",
    "OGNTAdapter",
    "SBLGNTAdapter",
    "KJVAdapter",
    "WEBBEAdapter",
    "BrentonAdapter",
    "PeshittaAdapter",
    "Luther1912Adapter",
    "DouayAdapter",
    "VamvasAdapter",
    "BDBAdapter",
    "LSJAdapter",
]

