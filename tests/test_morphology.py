"""Unit tests for UD to classical morphology mapping."""

import unittest
from pipeline.josephus_pipeline.ud_mapper import map_ud_to_classical, parse_feats_dict

class TestUDMapper(unittest.TestCase):
    def test_estin(self):
        # ἐστὶν: 3s pres ind act of εἰμί
        feats = "Mood=Ind|Number=Sing|Person=3|Tense=Pres|VerbForm=Fin|Voice=Act"
        pos, tag, desc = map_ud_to_classical("AUX", feats)
        self.assertEqual(pos, "verb")
        self.assertEqual(tag, "Pres Ind Act 3s")
        self.assertIn("Present", desc)
        self.assertIn("indicative", desc)
        self.assertIn("active", desc)
        self.assertIn("3rd singular", desc)

    def test_first_person_verb(self):
        # γράφω: 1s pres ind act
        feats = "Mood=Ind|Number=Sing|Person=1|Tense=Pres|VerbForm=Fin|Voice=Act"
        pos, tag, desc = map_ud_to_classical("VERB", feats)
        self.assertEqual(pos, "verb")
        self.assertEqual(tag, "Pres Ind Act 1s")

    def test_infinitive(self):
        # εἶναι: pres inf act
        feats = "Tense=Pres|VerbForm=Inf|Voice=Act"
        pos, tag, desc = map_ud_to_classical("VERB", feats)
        self.assertEqual(pos, "verb")
        self.assertEqual(tag, "Pres Inf Act")
        self.assertIn("infinitive", desc)

    def test_perilabein_aorist_infinitive(self):
        # περιλαβεῖν: Aorist infinitive active (NOT pluperfect)
        # Test both via Perseus xpos and via feats fallback
        pos1, tag1, desc1 = map_ud_to_classical("VERB", "Tense=Past|VerbForm=Inf|Voice=Act", xpos="v--ana---", word="περιλαβεῖν")
        self.assertEqual(pos1, "verb")
        self.assertEqual(tag1, "Aor Inf Act")
        self.assertIn("Aorist", desc1)
        self.assertIn("infinitive", desc1)
        self.assertIn("active", desc1)

        pos2, tag2, desc2 = map_ud_to_classical("VERB", "Aspect=Perf|Tense=Past|VerbForm=Inf|Voice=Act", word="περιλαβεῖν")
        self.assertEqual(pos2, "verb")
        self.assertEqual(tag2, "Aor Inf Act")
        self.assertIn("Aorist", desc2)

    def test_symbebekasi_perfect_indicative(self):
        # συμβεβήκασι: Perfect indicative active 3rd plural (NOT pluperfect)
        # Test both via Perseus xpos and via feats fallback
        feats = "Aspect=Perf|Mood=Ind|Number=Plur|Person=3|Tense=Past|VerbForm=Fin|Voice=Act"
        pos1, tag1, desc1 = map_ud_to_classical("VERB", feats, xpos="v3pria---", word="συμβεβήκασι")
        self.assertEqual(pos1, "verb")
        self.assertEqual(tag1, "Perf Ind Act 3p")
        self.assertIn("Perfect", desc1)
        self.assertIn("indicative", desc1)
        self.assertIn("active", desc1)
        self.assertIn("3rd plural", desc1)

        pos2, tag2, desc2 = map_ud_to_classical("VERB", feats, word="συμβεβήκασι")
        self.assertEqual(pos2, "verb")
        self.assertEqual(tag2, "Perf Ind Act 3p")
        self.assertIn("Perfect", desc2)

    def test_participle(self):
        # ὤν: pres part act nom sg m
        feats = "Case=Nom|Gender=Masc|Number=Sing|Tense=Pres|VerbForm=Part|Voice=Act"
        pos, tag, desc = map_ud_to_classical("VERB", feats)
        self.assertEqual(pos, "verb")
        self.assertEqual(tag, "Pres Part Act Nom Sg M")

    def test_noun(self):
        # γένος: nom/acc sg n
        feats = "Case=Nom|Gender=Neut|Number=Sing"
        pos, tag, desc = map_ud_to_classical("NOUN", feats)
        self.assertEqual(pos, "noun")
        self.assertEqual(tag, "Nom Sg N")
        self.assertEqual(desc, "Nominative singular neuter")

    def test_article(self):
        # ὁ: nom sg m
        feats = "Case=Nom|Gender=Masc|Number=Sing"
        pos, tag, desc = map_ud_to_classical("DET", feats)
        self.assertEqual(pos, "article")
        self.assertEqual(tag, "Nom Sg M")

if __name__ == "__main__":
    unittest.main()
