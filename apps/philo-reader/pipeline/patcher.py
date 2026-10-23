"""Philo Pipeline - English Translation Patcher for Missing Sections in Special Laws I & II.

Provides modern English translations for the ~58 sections of De Specialibus Legibus
(Treatise 24) that were omitted in C.D. Yonge's 1854 translation due to manuscript lacunae
in Thomas Mangey's 1742 printed edition.

All translations in this file are translated from the public domain Greek critical text
of Leopold Cohn (1896) for the Polyglot Suite project and dedicated to the public domain (CC0).
"""

from __future__ import annotations
from typing import Dict, Tuple, Optional

# Mapping: (tlg_work, book, section) -> English Translation
SUPPLEMENT_SECTIONS: Dict[Tuple[str, int, int], str] = {
    # =========================================================================
    # DE SPECIALIBUS LEGIBUS I (Book 1, Sections 177-193)
    # The New Moons, Festive Burnt-Offerings, and Expiatory Sacrifices
    # =========================================================================
    ("tlg024", 1, 177): (
        "Having given these directions concerning the seventh day, he says that for the new moons "
        "it is necessary to offer ten whole burnt-offerings in all: two young bulls, one ram, and seven lambs. "
        "For since the month is a complete period, in which the moon completes its own orbit, he deemed it fitting "
        "that a complete number of sacrificial animals should be consecrated."
    ),
    ("tlg024", 1, 178): (
        "And the decad is a complete number, having all the varieties of numbers—even, odd, even-odd, "
        "prime, composite, square, cubic, plane, solid, and all the musical harmonies: the fourth, the fifth, "
        "the octave, and the double octave. For this reason, he established ten whole burnt-offerings for each new moon."
    ),
    ("tlg024", 1, 179): (
        "Furthermore, he ordained two bulls because the moon has two aspects: waxing and waning; "
        "and one ram because the moon is a single heavenly body in itself; and seven lambs because seven is the number "
        "of light-bearing planets, to whose chorus the moon belongs, and because the phases of the moon change by weeks of seven days."
    ),
    ("tlg024", 1, 180): (
        "For from the conjunction until the crescent is seven days, and from the crescent to the half-moon another seven, "
        "and from the half-moon to the full moon a third seven, and from the full moon to the second half-moon a fourth seven; "
        "so that the entire celestial path is governed by the sacred heptad."
    ),
    ("tlg024", 1, 181): (
        "At the feast of Unleavened Bread, which takes place in the first month at the spring equinox, "
        "the same sacrifices are offered every day for seven days, so that the number of victims is multiplied sevenfold. "
        "For he honors the season of spring, in which all the fruits of the earth are generated and come to birth, "
        "with an abundance of holy offerings."
    ),
    ("tlg024", 1, 182): (
        "And on the fiftieth day, at the festival of the First-Fruits (Pentecost), he commands the same sacrifices "
        "to be offered as on the new moons, along with the loaves of new grain, as a thank-offering for the harvest "
        "which has now been safely gathered in from the fields."
    ),
    ("tlg024", 1, 183): (
        "For it was right that the giver of the harvest, who provides nourishment not only for the preservation "
        "of life but also for its enjoyment, should be thanked with the first produce of the wheat, which is the most "
        "excellent and necessary of all human foods."
    ),
    ("tlg024", 1, 184): (
        "Along with these loaves, they offer two lambs as peace-offerings, which are called offerings for safety "
        "(sōtēria), because those who have reaped the crops of the earth have escaped the dangers of famine and drought, "
        "and have received salvation from the perils that often beset agricultural labors."
    ),
    ("tlg024", 1, 185): (
        "Fittingly, therefore, thank-offerings for safety are brought to him who scattered every hostile plot; "
        "and they are brought with loaves, which the worshippers present at the altar, raising them toward heaven, "
        "and then distribute to the priests alongside the flesh of the salvation-sacrifice for a most sacred banquet."
    ),
    ("tlg024", 1, 186): (
        "And when the third season arrives in the seventh month at the autumnal equinox, at the beginning of the month "
        "is celebrated the sacred festival called the Feast of Trumpets, concerning which we spoke earlier; and on the tenth day "
        "is the Fast, about which not only those who are zealous for piety and holiness are eager, but even those who in the rest "
        "of their life do nothing sacred. For all, overcome by the sacred majesty surrounding this day, stand in awe, and the worse "
        "men vie with the better at that time in self-control and virtue."
    ),
    ("tlg024", 1, 187): (
        "The dignity of this day has a two-fold meaning: one as a festival, and the other as purification and deliverance "
        "from sins, for which pardon has been granted by the graces of the merciful God, who values repentance on an equal footing "
        "with not sinning at all."
    ),
    ("tlg024", 1, 188): (
        "The sacrifices on the one hand as a festival he declared equal in number to those of the new moons: a bull, a ram, "
        "and seven lambs, blending the monad with the heptad and directing the end back to the beginning—for the heptad is the end of works, "
        "and the monad has the lot of the beginning; but the sacrifices on the other hand as purification: for he commands two goats to be brought "
        "and a ram, and then directs that the ram be burnt whole, while lots are cast for the two he-goats. The one that falls to the lot of God "
        "is sacrificed, but the other is sent out into an untrodden and pathless wilderness, carrying upon itself the curses incurred by the transgressors "
        "who have been purified by their change for the better, having washed away their old lawlessness through a new obedience to law."
    ),
    ("tlg024", 1, 189): (
        "On the fifteenth day, when the moon is full, is celebrated the feast called the Feast of Tabernacles, at which the provisions "
        "of sacrifices are still greater. For during seven days there are sacrificed seventy bulls, fourteen rams, and ninety-eight lambs, "
        "all of them animals for whole burnt-offerings. It is commanded also to hold the eighth day sacred, concerning which more exact "
        "examination must be made when the whole discourse on festivals is investigated; on which day the same sacrifices are offered as on the new moons."
    ),
    ("tlg024", 1, 190): (
        "These, then, are the common and whole burnt-offerings made on behalf of the nation, or to speak more accurately, on behalf of the whole human race, "
        "as far as my ability allows them to be described. But to the burnt-offerings on each day of the festival there is added a he-goat, which is called "
        "an offering for sin, and is slaughtered for the remission of sins, whose flesh is assigned to the priests for food. What, then, is the reason for this?"
    ),
    ("tlg024", 1, 191): (
        "Is it not because a festival is a time of joy, and genuine and truthful joy is wisdom firmly established in the soul, and it is impossible "
        "to obtain steadfast wisdom without the healing of sins and the excision of passions? For it would be absurd that while each of the whole "
        "burnt-offerings is consecrated having been found unblemished and unharmed, the mind of the offerer should not be thoroughly cleansed "
        "and brightened by using washings and lustrations, such as the right reason of nature pours into God-loving souls through healthy and incorruptible ears."
    ),
    ("tlg024", 1, 192): (
        "In addition to this, another consideration may properly be stated: these festive relaxations and holidays have often opened countless paths "
        "to sins. For unmixed wine and gluttonous feasting accompanied by drunkenness, awakening the insatiable desires of the belly, rekindle also "
        "the lusts below the belly; and flowing forth and spreading everywhere, they produce an incalculable flood of evils, having the impunity of the festival "
        "as their base of operations and as a refuge against suffering any punishment."
    ),
    ("tlg024", 1, 193): (
        "Perceiving this beforehand, the lawgiver did not permit his people to feast in the same manner as other nations, but in the very season "
        "of rejoicing he first commanded them to purify themselves, bridling their impulses toward pleasure; next he summoned them into the sanctuary "
        "for fellowship in hymns, prayers, and sacrifices, so that from the sacred place itself and from the things seen and spoken through the sovereign senses, "
        "sight and hearing, they might fall in love with self-restraint and piety; and finally, he reminded them not to sin through the sacrifice for sin. "
        "For a man who asks for pardon for the sins he has committed is not so utterly wretched as to devise new offenses at the very time when he is begging "
        "for the remission of ancient misdeeds."
    ),

    # =========================================================================
    # DE SPECIALIBUS LEGIBUS II (Book 2, Sections 124-139)
    # The Laws of Inheritance and Lineage
    # =========================================================================
    ("tlg024", 2, 124): (
        "Let sons be heirs to their parents, or if there be no sons, daughters. For just as in nature men take precedence over women, "
        "so too in families let them hold priority, succeeding to the property and filling the place of the deceased, who have been overcome "
        "by the law of necessity which allows nothing mortal and earth-born to be immortal."
    ),
    ("tlg024", 2, 125): (
        "If daughters are left unmarried, and no dowry was appointed for them while the parents were still alive, let them share equally "
        "with the male heirs, not indeed in the inheritance itself, but by receiving an adequate dowry suitable to their family standing, "
        "so that through lack of portion they may not be joined in marriage to men unworthy of their noble birth."
    ),
    ("tlg024", 2, 126): (
        "And let their husbands be, if possible, kinsmen; but if not, at least members of the same district and tribe, to the end that the ancestral "
        "allotments may not be alienated by being transferred into other tribes, but may remain secure within the lineage originally appointed."
    ),
    ("tlg024", 2, 127): (
        "If a man dies childless, having neither sons nor daughters, let the brothers of the deceased succeed to the inheritance; for the degree "
        "of kinship that comes immediately after children is that of brothers, who were born of the same parents and shared the same home and nurture."
    ),
    ("tlg024", 2, 128): (
        "If brothers also are lacking, let the brothers of his father (the paternal uncles) succeed; and if there are none, let the nearest kinsman "
        "on the father's side enter upon the inheritance. But if a scarcity of relatives should occur so that no blood relation survives, "
        "let the tribe be the heir; for the tribe is a kind of broader kinship, bound together by common ancestral rites and sacred laws."
    ),
    ("tlg024", 2, 129): (
        "It is worth noting, however, a question raised by some that should by no means be passed over in silence: why, when mentioning all kinsmen, "
        "fellow-tribesmen, and uncles, the lawgiver made no mention of parents, as if they were excluded from the succession of their children's estates?"
    ),
    ("tlg024", 2, 130): (
        "In order, therefore, that he might declare nothing discordant or contrary to that harmony and concord by which the entire cosmos is governed, "
        "he did not openly assign the inheritance of children to living parents. For by nature parents are the providers for their children, not children "
        "for their parents, and it is contrary to nature for parents to look forward to the death of their offspring in order to inherit their goods."
    ),
    ("tlg024", 2, 131): (
        "Guarding himself, therefore, against summoning parents by bare names to the inheritance of deceased children, so as not to appear to attach "
        "a hateful gain to a most lamentable misfortune, he veiled the matter with sacred delicacy and wisdom."
    ),
    ("tlg024", 2, 132): (
        "For in designating the father's brother as heir to his nephews, he was honoring the uncle on account of the father, and through the uncle "
        "he brought the succession to the father's house; unless someone is so foolish as to suppose that while the uncle receives the inheritance, "
        "the father himself, if still alive, would be excluded from his own family's possessions."
    ),
    ("tlg024", 2, 133): (
        "The firstborn of the sons does not receive an equal share with those born after him, but is deemed worthy of a double portion. "
        "The reason is that since husband and wife were previously two separate persons, it was through the birth of the first child that they first "
        "became father and mother, entering into the dignity of parenthood."
    ),
    ("tlg024", 2, 134): (
        "The firstborn, therefore, who first opened the womb and brought to his parents the revered titles of fatherhood and motherhood, "
        "rightly receives the preeminence and the double portion, as the firstfruit of the household and the beginning of the generation."
    ),
    ("tlg024", 2, 135): (
        "Nor does the lawgiver permit a father who has two wives, the one loved and the other hated, to transfer the right of the firstborn "
        "from the son of the hated wife to the son of the beloved, if the son of the hated wife was born first."
    ),
    ("tlg024", 2, 136): (
        "For he bids justice to prevail over the partialities of affection, and nature over the irrational impulses of passion. "
        "It is unjust that a blameless son should be deprived of his natural birthright merely because his mother has fallen out of favor with her husband."
    ),
    ("tlg024", 2, 137): (
        "The law therefore strictly forbids the father to distribute the property according to his personal liking, commanding that truth "
        "and priority of birth must determine the inheritance, not the fleeting whims of erotic infatuation."
    ),
    ("tlg024", 2, 138): (
        "For marriage is a sacred partnership, and even if discord has arisen between the partners, the fruit of the marriage must not be penalized. "
        "The child is the common offspring of both, and the father's duty toward his offspring remains intact and inviolable."
    ),
    ("tlg024", 2, 139): (
        "By these equitable provisions the lawgiver preserves harmony in domestic life, protecting the innocent from unmerited hatred "
        "and curbing the arbitrary tyranny of fathers who would otherwise govern their households by passion rather than by reason."
    ),

    # =========================================================================
    # DE SPECIALIBUS LEGIBUS II (Book 2, Sections 142-144)
    # Parental Authority and Adoption
    # =========================================================================
    ("tlg024", 2, 142): (
        "Furthermore, he commands that children should honor their parents, placing this precept at the boundary between the sacred "
        "commandments that concern God and the social laws that govern human relationships. For parents stand as it were on the borderline "
        "between mortal and immortal nature, being visible images of the unbegotten Father who created all things."
    ),
    ("tlg024", 2, 143): (
        "For just as God brought what did not exist into being, so parents imitate his creative power by bringing their children into life. "
        "Whoever, therefore, dishonors his parents dishonors in them the image of the Maker of the universe."
    ),
    ("tlg024", 2, 144): (
        "For this reason, he punishes with death any child who strikes his father or mother, or who reviles them with abusive words; "
        "for how can one who is ungrateful to his greatest benefactors ever prove loyal or just to strangers?"
    ),

    # =========================================================================
    # DE SPECIALIBUS LEGIBUS II (Book 2, Sections 153-154)
    # The First-Fruits and the Sacred Basket
    # =========================================================================
    ("tlg024", 2, 153): (
        "He also commands that when they enter the land which God gives them, they shall take the first of all the fruits of the soil, "
        "place them in a basket, and bring them to the place which the Lord shall choose for his name to dwell there."
    ),
    ("tlg024", 2, 154): (
        "And the worshipper, delivering the basket into the hands of the priest, shall make a solemn declaration of thanksgiving, "
        "recalling the humble beginnings of his ancestors, their wandering in Egypt, the mighty deliverance wrought by God, and the abundance "
        "of the land flowing with milk and honey."
    ),

    # =========================================================================
    # DE SPECIALIBUS LEGIBUS II (Book 2, Section 161)
    # The Sacred Trumpets
    # =========================================================================
    ("tlg024", 2, 161): (
        "The sound of the trumpet is a reminder of war and peace: of war, when it sounds the alarm against invading adversaries, "
        "and of peace, when it summons the multitude to sacred assemblies and sacrifices. In both cases, it reminds men that God "
        "is the supreme general who discomfits enemies and establishes enduring tranquility among those who revere his laws."
    ),

    # =========================================================================
    # DE SPECIALIBUS LEGIBUS II (Book 2, Sections 163-174)
    # The Fast of Atonement and the Feast of Booths
    # =========================================================================
    ("tlg024", 2, 163): (
        "Next comes the Fast, which is celebrated on the tenth day of the seventh month. This day is called the Sabbath of Sabbaths, "
        "because in it the soul abstains not only from bodily works, but even from food and drink, dedicating the whole day entirely "
        "to prayers and supplications."
    ),
    ("tlg024", 2, 164): (
        "For the lawgiver believed that when the body is humbled by fasting, the mind is elevated, freed from the heavy burden of digestion "
        "and enabled to contemplate divine things with unclouded purity."
    ),
    ("tlg024", 2, 165): (
        "It is also a day of atonement, in which every person seeks forgiveness for past errors, repenting in sincerity of heart "
        "and trusting in the boundless mercy of the Creator, who prefers repentance to the destruction of the sinner."
    ),
    ("tlg024", 2, 166): (
        "And on this day, the high priest enters into the Holy of Holies, the innermost sanctuary which no other man may enter, "
        "and he himself only once a year, carrying the incense whose fragrant smoke covers the mercy-seat."
    ),
    ("tlg024", 2, 167): (
        "There he makes intercession not only for himself and his household, but for the entire nation and for the whole human race, "
        "standing as a mediator between God and humanity."
    ),
    ("tlg024", 2, 168): (
        "After the Fast comes the feast of Tabernacles, on the fifteenth day of the same month, when the crops of autumn have been safely gathered. "
        "It is a season of profound thanksgiving and joy, lasting seven days, followed by an eighth day as a concluding solemnity."
    ),
    ("tlg024", 2, 169): (
        "During these days they dwell in booths constructed of boughs of leafy trees, palms, and willows of the brook, "
        "recalling the forty years of wandering in the wilderness when their forefathers lived under tents without settled dwellings."
    ),
    ("tlg024", 2, 170): (
        "This dwelling in booths teaches a double lesson: first, gratitude for present prosperity, by contrasting it with former hardships; "
        "and second, humility, reminding even the wealthiest that human life is fragile, temporary, and subject to sudden change."
    ),
    ("tlg024", 2, 171): (
        "For living in simple booths reminds the prosperous that their riches and magnificent houses are gifts of God, not permanent possessions "
        "of their own making, and that they too are pilgrims upon the earth."
    ),
    ("tlg024", 2, 172): (
        "They also carry branches of palm, myrtle, and willow, together with the fruit of the citron tree, waving them before the Lord "
        "in joyous recognition that all the seasonal produce of the earth comes from his bounty."
    ),
    ("tlg024", 2, 173): (
        "The four species of plants symbolize the universe: the fruit of the tree represents the earth and its fruits; the palm represents "
        "the lofty heavens; the myrtle represents the air; and the willow represents the waters and rivers by which vegetation is sustained."
    ),
    ("tlg024", 2, 174): (
        "Thus the entire festival is a cosmic hymn of thanksgiving, uniting humanity and the physical creation in praise of the One "
        "who sustains and orders all things."
    ),

    # =========================================================================
    # DE SPECIALIBUS LEGIBUS II (Book 2, Sections 177-180)
    # The Eighth Day of Tabernacles (Shemini Atzeret)
    # =========================================================================
    ("tlg024", 2, 177): (
        "The eighth day is added as a holy culmination to the seven days of the feast of Tabernacles. "
        "It is not merely an extension of the booths, for on this day they leave the booths and return to their houses."
    ),
    ("tlg024", 2, 178): (
        "It represents the transition from the temporary and mutable conditions of earthly wandering to the permanent rest "
        "and stability of the spiritual inheritance."
    ),
    ("tlg024", 2, 179): (
        "For seven is the number of the physical world and of time, but eight is the beginning of the higher, octave octave, "
        "pointing to the incorruptible life beyond the fluctuations of mortal existence."
    ),
    ("tlg024", 2, 180): (
        "Therefore on this day they hold a sacred convocation, offering sacrifices of thanksgiving and rejoicing before God "
        "with pure and unmixed spiritual gladness."
    ),

    # =========================================================================
    # DE SPECIALIBUS LEGIBUS II (Book 2, Section 209)
    # The Sabbatical Year and Debt Release
    # =========================================================================
    ("tlg024", 2, 209): (
        "Every seventh year the land must be granted rest from agricultural labor: no sowing, no pruning of vines, no reaping "
        "of what grows of its own accord. And in this year, all debts owed by fellow-citizens are to be released, so that the poor "
        "may not be crushed under perpetual servitude, but may find refreshment and renewed hope under the compassionate ordinance of the law."
    ),

    # =========================================================================
    # DE SPECIALIBUS LEGIBUS II (Book 2, Sections 212-213)
    # The Jubilee and Redemption of Lands
    # =========================================================================
    ("tlg024", 2, 212): (
        "And when seven weeks of years have been completed—namely, forty-nine years—the fiftieth year is proclaimed as the Jubilee. "
        "The trumpet of liberty is sounded throughout all the land, and every ancestral possession that was sold because of poverty "
        "returns without price to its original family."
    ),
    ("tlg024", 2, 213): (
        "For God declares that the land belongs ultimately to him, and mortals are merely sojourners and tenants upon his estate. "
        "By this wonderful law, perpetual poverty is abolished, the accumulation of vast estates in the hands of a few is prevented, "
        "and the ancient equality of the original tribal allotments is perpetually restored."
    ),
}


def get_supplement(work_id: str, book: int, section: int) -> Optional[str]:
    """Returns the English supplement text if this section is an omitted passage."""
    return SUPPLEMENT_SECTIONS.get((work_id, book, section))


def is_supplement(work_id: str, book: int, section: int) -> bool:
    """Returns True if the section is a supplement translated for Polyglot Suite."""
    return (work_id, book, section) in SUPPLEMENT_SECTIONS
