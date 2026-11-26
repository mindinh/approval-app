import { activeMention, activeTags, appendMention, buildSearchIndex, fold, insertMention, mentionParts, remainingCharacters, removeMention, searchMentionUsers, serializeComment, type MentionUser } from '@/utils/mentions';

const an: MentionUser = { sapUser: 'ANNGUYEN', fullName: 'Nguyễn Văn An', email: 'an@conarum.com' };
const binh: MentionUser = { sapUser: 'BTRAN', fullName: 'Trần Bình', email: 'binh@conarum.com' };
const anh: MentionUser = { sapUser: 'ANH', fullName: 'Nguyễn Văn An Hai', email: '' };

describe('activeMention', () => {
    it('finds "@query" at the caret, also with spaces', () => {
        expect(activeMention('Hi @ngu', 7)).toEqual({ start: 3, query: 'ngu' });
        expect(activeMention('@nguyen van', 11)).toEqual({ start: 0, query: 'nguyen van' });
        expect(activeMention('@', 1)).toEqual({ start: 0, query: '' });
    });

    it('ignores e-mail addresses, line breaks and a space right after @', () => {
        expect(activeMention('mail a@b.com', 12)).toBeNull();
        expect(activeMention('@an\nok', 6)).toBeNull();
        expect(activeMention('@ x', 3)).toBeNull();
    });
});

describe('search', () => {
    const index = buildSearchIndex([binh, an, anh]);
    it('is accent-insensitive and matches name words in any order', () => {
        expect(fold('Đặng Nguyễn')).toBe('dang nguyen');
        expect(searchMentionUsers(index, 'nguyen', 10).map((user) => user.sapUser)).toEqual(['ANNGUYEN', 'ANH']);
        expect(searchMentionUsers(index, 'van ngu', 10)[0].sapUser).toBe('ANNGUYEN');
        expect(searchMentionUsers(index, 'btran', 10).map((user) => user.sapUser)).toEqual(['BTRAN']);
        expect(searchMentionUsers(index, 'binh@', 10).map((user) => user.sapUser)).toEqual(['BTRAN']);
    });
});

describe('several people in one comment', () => {
    it('inserts, keeps and serializes multiple mentions like the web', () => {
        const first = insertMention('Hi @ngu', 3, 7, an);
        expect(first).toEqual({ text: 'Hi @Nguyễn Văn An ', caret: 18 });
        const text = `${appendMention(first.text, binh)}please check`;
        expect(text).toBe('Hi @Nguyễn Văn An @Trần Bình please check');
        expect(activeTags(text, [an, binh]).length).toBe(2);
        expect(serializeComment(text, [an, binh])).toBe('Hi <tag>@Nguyễn Văn An</tag> <tag>@Trần Bình</tag> please check');
    });

    it('a longer name is not split by a shorter one', () => {
        expect(serializeComment('@Nguyễn Văn An Hai ok', [an, anh])).toBe('<tag>@Nguyễn Văn An Hai</tag> ok');
    });

    it('editing or removing a name un-tags that person only', () => {
        expect(activeTags('Hi @Nguyễn Văn A @Trần Bình', [an, binh]).map((user) => user.sapUser)).toEqual(['BTRAN']);
        expect(removeMention('Hi @Nguyễn Văn An @Trần Bình ok', an)).toBe('Hi @Trần Bình ok');
    });

    it('escapes a typed <tag> so it cannot fake a mention', () => {
        expect(serializeComment('<tag>@Boss</tag>', [])).toBe('&lt;tag&gt;@Boss&lt;/tag&gt;');
    });

    it('counts markup against the 255 limit and highlights mentions', () => {
        expect(remainingCharacters('@Trần Bình', [binh])).toBe(255 - '<tag>@Trần Bình</tag>'.length);
        expect(mentionParts('Hi @Trần Bình!', [binh])).toEqual([
            { text: 'Hi ', mention: false },
            { text: '@Trần Bình', mention: true },
            { text: '!', mention: false },
        ]);
    });
});
