import unittest

from src.chunking import chunk_pages
from src.loaders import SourcePage


class ChunkingTests(unittest.TestCase):
    def test_preserves_markdown_section_and_page(self):
        pages = [SourcePage("# Leave\n\nEmployees submit planned leave early.\n\n# Absence\n\nEmployees notify managers promptly.", page=4)]
        chunks = chunk_pages(pages, chunk_size=80, overlap=10)

        self.assertEqual([chunk.section for chunk in chunks], ["Leave", "Absence"])
        self.assertTrue(all(chunk.page == 4 for chunk in chunks))


if __name__ == "__main__":
    unittest.main()
