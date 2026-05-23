import json
import os
import re

# Paths to the JSON files
PATHS = [
    r"D:\Drive\Proyectos\Alabando\web\public\data\himnos.json",
    r"D:\Drive\Proyectos\Alabando\original\app\src\main\assets\himnos.json"
]

def clean_line(line):
    """Strip whitespace from a lyric line. // repeat markers are preserved as-is."""
    return line.strip()

def parse_himno_96(letra):
    """Programmatic custom parser for Hymn 96 to handle its unique structure perfectly."""
    note_lines = [
        "Este himno puede ser abreviado, cantando sólo las estrofas",
        "1, 2, 7, 9, 11, 14, 17, 21 y 22, marcadas con asterísco"
    ]
    sections = [{
        't': 'n',
        'l': note_lines
    }]
    
    clean_letra = letra.replace('\r\n', '\n')
    
    # Locate the first verse, which starts with "1*"
    first_verse_idx = clean_letra.find('1*')
    if first_verse_idx == -1:
        first_verse_idx = clean_letra.find('1\n')
        
    if first_verse_idx == -1:
        # Fallback to standard parser if we can't find the starting verse
        return None
        
    verses_part = clean_letra[first_verse_idx:]
    
    # Split into verse blocks by double newlines
    blocks = [b.strip() for b in verses_part.split('\n \n') if b.strip()]
    for block in blocks:
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if not lines:
            continue
            
        first_line = lines[0]
        # Match a number (and optional asterisk) at the very start of the block
        match = re.match(r'^(\d+)(\*)?[\s\.\-\)]*(.*)$', first_line)
        if match:
            v_num = int(match.group(1))
            is_starred = match.group(2) is not None
            rest_of_first_line = match.group(3).strip()
            
            if rest_of_first_line:
                v_lines = [rest_of_first_line] + lines[1:]
            else:
                v_lines = lines[1:]
                
            if is_starred and v_lines:
                v_lines[0] = f"* {v_lines[0]}"
                
            sections.append({
                't': 'e',
                'n': v_num,
                'l': v_lines
            })
        else:
            sections.append({
                't': 'e',
                'l': lines
            })
            
    return sections

def parse_himno_letra(letra, himno_num=None):
    if himno_num == '96':
        custom_res = parse_himno_96(letra)
        if custom_res is not None:
            return custom_res
            
    lines = [line.strip() for line in letra.replace('\r\n', '\n').split('\n')]
    # Note: // markers inside lines are cleaned per-line after footnote detection below
    
    sections = []
    current_section = None
    
    # Defaults
    active_type = 'e'  # 'e' for estrofa / verse
    active_num = None
    
    for line in lines:
        if not line:
            # Empty line closes the current section
            current_section = None
            continue
            
        # 1. Footnotes or annotations (starting with * or "Este himno")
        # Note: // is a repeat marker in printed hymnals, NOT a footnote
        if line == '*' or (line.startswith('*') and not line.startswith('*[')) or line.lower().startswith('este himno'):
            if current_section and current_section['t'] != 'n':
                current_section = None
            if not current_section:
                current_section = {
                    't': 'n', # 'n' for footnote/note
                    'l': []
                }
                sections.append(current_section)
            current_section['l'].append(line)
            continue

        # If we are currently in a note section, everything in this paragraph is part of the note
        # UNLESS it looks like the start of a real verse (e.g. starting with a number and containing no note metadata keywords)
        if current_section and current_section['t'] == 'n':
            is_new_verse = False
            verse_match = re.match(r'^(\d+)\b', line)
            if verse_match:
                lower_line = line.lower()
                has_metadata = any(kw in lower_line for kw in ['estrofa', 'cantando', 'abreviado', 'abreviar', 'usado como', 'himno', 'nota'])
                if not has_metadata:
                    is_new_verse = True
            
            if is_new_verse:
                current_section = None  # Close the note section, let the rest of the loop parse it as a new verse
            else:
                current_section['l'].append(line)
                continue

        # // repeat markers are kept in the text as visual indicators for singers
            
        # 2. Section titles like (Segunda parte)
        part_match = re.match(r'^\((Primera|Segunda|Tercera|Cuarta|Quinta)\s+parte\)$', line, re.IGNORECASE)
        if part_match:
            current_section = {
                't': 's', # 's' for section title
                'lbl': line[1:-1].strip().capitalize(),
                'l': [line]
            }
            sections.append(current_section)
            current_section = None
            continue
            
        # 3. Standalone section headers like CORO, PRE-CORO, PUENTE, ESTROFA
        header_match = re.match(r'^(CORO|PRE-CORO|PUENTE|ESTROFA)\s*(\d*)\s*(\[.*\])?$', line, re.IGNORECASE)
        if header_match:
            h_name = header_match.group(1).upper()
            h_num = header_match.group(2)
            
            if h_name == 'CORO':
                active_type = 'c'
            elif h_name == 'PRE-CORO':
                active_type = 'p'
            elif h_name == 'PUENTE':
                active_type = 'b'
            elif h_name == 'ESTROFA':
                active_type = 'e'
                
            active_num = int(h_num) if h_num else None
            
            # Save section header placeholder
            current_section = {
                't': 's',
                'lbl': line.strip(),
                'l': []
            }
            sections.append(current_section)
            current_section = None
            continue

        # 4. Inline section headers (e.g. "1 Gloria dad...", "ESTROFA 1 Te elijo...", "CORO ¡Alabadle!...")
        verse_num_match = re.match(r'^(\d+)\b[\.\-\s\)]*(.*)$', line)
        estrofa_match = re.match(r'^ESTROFA\s*(\d+)\b[\.\-\s\)]*(.*)$', line, re.IGNORECASE)
        inline_coro_match = re.match(r'^(CORO|PRE-CORO|PUENTE)\s*(\d*)\s*[\.\-\s\)]*(.*)$', line, re.IGNORECASE)
        
        inline_header_name = None
        matched_header = False
        s_type = active_type
        s_num = active_num
        s_text = line
        
        if estrofa_match:
            s_type = 'e'
            s_num = int(estrofa_match.group(1))
            s_text = estrofa_match.group(2).strip()
            active_type = 'e'
            active_num = s_num
            matched_header = True
        elif verse_num_match:
            s_type = 'e'
            s_num = int(verse_num_match.group(1))
            s_text = verse_num_match.group(2).strip()
            active_type = 'e'
            active_num = s_num
            matched_header = True
        elif inline_coro_match:
            c_name = inline_coro_match.group(1).upper()
            c_num = inline_coro_match.group(2)
            
            if c_name == 'CORO':
                s_type = 'c'
            elif c_name == 'PRE-CORO':
                s_type = 'p'
            elif c_name == 'PUENTE':
                s_type = 'b'
                
            s_num = int(c_num) if c_num else None
            s_text = inline_coro_match.group(3).strip()
            active_type = s_type
            active_num = s_num
            matched_header = True
            inline_header_name = c_name
            
        if matched_header:
            prev_label = None
            if sections and not sections[-1]['l'] and 'lbl' in sections[-1]:
                prev_label = sections[-1]['lbl']
                sections.pop()
                
            # If it is an inline chorus, pre-chorus, or bridge and we didn't consume a previous label,
            # we inject a section title ('s') so that it renders as a header in the UI.
            if s_type in ['c', 'p', 'b'] and not prev_label:
                title_lbl = inline_header_name if inline_header_name else s_type.upper()
                if s_num is not None:
                    title_lbl += f" {s_num}"
                sections.append({
                    't': 's',
                    'lbl': title_lbl,
                    'l': []
                })
                
            current_section = {
                't': s_type,
                'l': []
            }
            if prev_label:
                current_section['lbl'] = prev_label
            if s_num is not None:
                current_section['n'] = s_num
            sections.append(current_section)
            if s_text:
                current_section['l'].append(s_text)
            active_num = None
            continue

        # 5. Voice/role labels (e.g. "Hermanos:", "(Hermanas)")
        voice_label_match = re.match(r'^([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+):\s*(.*)$', line)
        paren_label_match = re.match(r'^\(([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)\)\s*(.*)$', line)
        
        extracted_label = None
        remaining_text = line
        
        if voice_label_match:
            lbl = voice_label_match.group(1).strip()
            if lbl.lower() in ['hermanos', 'hermanas', 'todos', 'mujeres', 'varones', 'solista', 'unísono', 'coro 1', 'coro 2', 'coro', 'unisono', 'novia', 'novio', 'esposa', 'esposo']:
                extracted_label = lbl.capitalize()
                remaining_text = voice_label_match.group(2).strip()
        elif paren_label_match:
            lbl = paren_label_match.group(1).strip()
            if lbl.lower() in ['hermanos', 'hermanas', 'todos', 'mujeres', 'varones', 'solista', 'unísono', 'coro 1', 'coro 2', 'coro', 'unisono', 'novia', 'novio', 'esposa', 'esposo']:
                extracted_label = lbl.capitalize()
                remaining_text = paren_label_match.group(2).strip()
                
        if extracted_label:
            current_section = {
                't': active_type,
                'lbl': extracted_label,
                'l': []
            }
            if active_num is not None:
                current_section['n'] = active_num
            sections.append(current_section)
            if remaining_text:
                current_section['l'].append(remaining_text)
            active_num = None
            continue
            
        # 6. Check for (Coro 1) references which are inline footnotes
        if line.startswith('(') and line.endswith(')') and 'coro' in line.lower():
            current_section = {
                't': 'n',
                'l': [line]
            }
            sections.append(current_section)
            current_section = None
            continue

        # 7. Regular line of lyrics
        if not current_section:
            current_section = {
                't': active_type,
                'l': []
            }
            if active_num is not None:
                current_section['n'] = active_num
            sections.append(current_section)
            active_num = None
            
        current_section['l'].append(line)

    # Post-process: clean up lists and remove empty sections
    cleaned_sections = []
    for s in sections:
        s['l'] = [l for l in s['l'] if l]
        if not s['l'] and 'lbl' not in s:
            continue
        cleaned_sections.append(s)
        
    return cleaned_sections

def run_standardization():
    for path in PATHS:
        if not os.path.exists(path):
            print(f"Warning: File not found at {path}")
            continue
            
        print(f"Reading {path}...")
        with open(path, 'r', encoding='utf-8') as f:
            himnos = json.load(f)
            
        print(f"Processing {len(himnos)} himnos...")
        for h in himnos:
            h['letra_estructurada'] = parse_himno_letra(h['letra'], str(h.get('numero')))
            
        print(f"Writing updated JSON to {path}...")
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(himnos, f, ensure_ascii=False, indent=4)
            
        print(f"Done processing {path}")

if __name__ == '__main__':
    run_standardization()
